import subprocess
import sys
import importlib

def install_dependencies():
    # If running as EXE, libraries are already bundled. Just check Playwright.
    is_frozen = getattr(sys, 'frozen', False)
    
    if not is_frozen:
        packages = ["playwright", "playwright-stealth", "customtkinter", "requests", "pyperclip"]
        for package in packages:
            try:
                importlib.import_module(package.replace("-", "_"))
            except ImportError:
                print(f"[*] Installing {package}...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    
    # Ensure Playwright browsers are installed (even for EXE)
    try:
        # In EXE, we need to find the real playwright executable or use the bundled one
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
    except:
        pass

# Run installer will be moved to the bottom under if __name__ == "__main__"

import asyncio
import threading
import json
import random
import string
import time
from datetime import date
import customtkinter as ctk
from playwright.async_api import async_playwright
from playwright_stealth import stealth
import requests
import pyperclip

# --- CONFIGURATION ---
DB_FILE = "windsurf.db"

USER_DETAILS = {
    "first_name": "Yousef",
    "last_name": "Sayed",
    "password": "Yousef231"
}

MAIL_TM_API = "https://api.mail.tm"

# --- DATABASE MANAGER ---
import sqlite3

class DBManager:
    def __init__(self):
        self.init_db()

    def init_db(self):
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    first_name TEXT,
                    last_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used_at TEXT DEFAULT '2000-01-01'
                )
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[-] DB Init Error: {e}")

    def save_account(self, email, password, f_name, l_name):
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            query = "INSERT INTO accounts (email, password, first_name, last_name) VALUES (?, ?, ?, ?)"
            cursor.execute(query, (email, password, f_name, l_name))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"[-] DB Save Error: {e}")
            return False

    def get_unused_account(self):
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            today = date.today().isoformat()
            query = "SELECT email FROM accounts WHERE last_used_at != ? OR last_used_at IS NULL LIMIT 1"
            cursor.execute(query, (today,))
            result = cursor.fetchone()
            if result:
                email = result[0]
                update_query = "UPDATE accounts SET last_used_at = ? WHERE email = ?"
                cursor.execute(update_query, (today, email))
                conn.commit()
                conn.close()
                return email
            conn.close()
            return None
        except Exception as e:
            print(f"[-] DB Fetch Error: {e}")
            return None

# --- MAIL.TM MANAGER ---
class MailTM:
    @staticmethod
    async def create_account(retries=3):
        for _ in range(retries):
            try:
                domain_resp = requests.get(f"{MAIL_TM_API}/domains", timeout=10).json()
                domain = domain_resp["hydra:member"][0]["domain"]
                
                username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
                email = f"{username}@{domain}"
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
                
                resp = requests.post(f"{MAIL_TM_API}/accounts", json={
                    "address": email,
                    "password": password
                }, timeout=10)
                
                if resp.status_code == 201:
                    return {"email": email, "password": password}
            except:
                pass
            await asyncio.sleep(2)
        return None

    @staticmethod
    async def get_token(email, password):
        resp = requests.post(f"{MAIL_TM_API}/token", json={"address": email, "password": password})
        return resp.json().get("token") if resp.status_code == 200 else None

    @staticmethod
    async def wait_for_code(token, timeout=120):
        headers = {"Authorization": f"Bearer {token}"}
        start_time = time.time()
        while time.time() - start_time < timeout:
            resp = requests.get(f"{MAIL_TM_API}/messages", headers=headers)
            if resp.status_code == 200:
                msgs = resp.json().get("hydra:member", [])
                for m in msgs:
                    # Get detail
                    detail = requests.get(f"{MAIL_TM_API}/messages/{m['id']}", headers=headers).json()
                    content = detail.get("text", "")
                    # Extract 6-digit code
                    import re
                    match = re.search(r'\b\d{6}\b', content)
                    if match:
                        return match.group(0)
            await asyncio.sleep(5)
        return None

# --- AUTOMATION ENGINE ---
class WindsurfCreator:
    def __init__(self, log_func, db_manager):
        self.log = log_func
        self.db = db_manager

    async def create_one(self):
        # Random sleep to stagger requests and avoid simultaneous API calls
        await asyncio.sleep(random.uniform(1, 2))
        
        acc = await MailTM.create_account()
        if not acc:
            return False
        
        email = acc["email"]
        self.log(f"[EMAIL] {email}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True) 
            context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
            page = await context.new_page()
            
            try:
                await stealth(page)
            except: pass

            try:
                self.log(f"[START] Registering: {email[:10]}...")
                await page.goto("https://windsurf.com/account/register", timeout=60000)
                
                # --- PAGE 1: Registration ---
                await page.wait_for_selector('input[autocomplete="given-name"]', timeout=10000)
                await page.fill('input[autocomplete="given-name"]', USER_DETAILS["first_name"])
                await page.fill('input[autocomplete="family-name"]', USER_DETAILS["last_name"])
                await page.fill('input[name="email"]', email)
                
                try:
                    checkbox = await page.query_selector('input#auth1-agree-tos')
                    if checkbox and not await checkbox.is_checked():
                        await checkbox.check()
                except: pass
                
                await page.click('button[type="submit"]')
                
                # --- PAGE 2: Password ---
                await page.wait_for_selector('input[name="password"]', timeout=10000)
                await page.fill('input[name="password"]', USER_DETAILS["password"])
                await page.fill('input[name="confirmPassword"]', USER_DETAILS["password"])
                await page.click('button[type="submit"]')
                
                # --- PAGE 3: Verification ---
                token = await MailTM.get_token(email, acc["password"])
                code = await MailTM.wait_for_code(token)
                
                if code:
                    self.log(f"[CODE] {code}")
                    inputs = await page.query_selector_all('input[maxlength="1"]')
                    if len(inputs) >= 6:
                        for idx, char in enumerate(code):
                            await inputs[idx].fill(char)
                            await asyncio.sleep(0.1)
                    else:
                        await page.wait_for_selector('input[autocomplete="one-time-code"]', timeout=5000)
                        await page.focus('input[autocomplete="one-time-code"]')
                        await page.keyboard.type(code, delay=100)
                    
                    await page.keyboard.press("Enter")
                    await asyncio.sleep(5)
                    
                    self.log(f"[SUCCESS] {email}")
                    self.db.save_account(email, USER_DETAILS["password"], USER_DETAILS["first_name"], USER_DETAILS["last_name"])
                    return True
            except:
                pass
            finally:
                await browser.close()
        return False

# --- GUI APPLICATION ---
class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Windsurf Account Automator")
        self.geometry("700x500")
        ctk.set_appearance_mode("dark")
        
        self.db = DBManager()
        self.is_running = False
        
        # UI Elements
        self.grid_columnconfigure(0, weight=1)
        
        self.label = ctk.CTkLabel(self, text="Windsurf Account Generator", font=("Arial", 24, "bold"))
        self.label.pack(pady=20)
        
        self.count_frame = ctk.CTkFrame(self)
        self.count_frame.pack(pady=10)
        
        self.count_label = ctk.CTkLabel(self.count_frame, text="Accounts to create:")
        self.count_label.pack(side="left", padx=10)
        
        self.minus_btn = ctk.CTkButton(self.count_frame, text="-", width=30)
        self.minus_btn.pack(side="left", padx=2)
        self.minus_btn.bind("<ButtonPress-1>", lambda e: self.start_repeat(-1))
        self.minus_btn.bind("<ButtonRelease-1>", lambda e: self.stop_repeat())
        
        self.count_entry = ctk.CTkEntry(self.count_frame, width=60, justify="center")
        self.count_entry.insert(0, "5")
        self.count_entry.pack(side="left", padx=2)
        
        self.plus_btn = ctk.CTkButton(self.count_frame, text="+", width=30)
        self.plus_btn.pack(side="left", padx=2)
        self.plus_btn.bind("<ButtonPress-1>", lambda e: self.start_repeat(1))
        self.plus_btn.bind("<ButtonRelease-1>", lambda e: self.stop_repeat())
        
        self.btn_frame = ctk.CTkFrame(self)
        self.btn_frame.pack(pady=10)
        
        self.start_btn = ctk.CTkButton(self.btn_frame, text="Start Creating", command=self.start_work, fg_color="green")
        self.start_btn.pack(side="left", padx=10)
        
        self.copy_btn = ctk.CTkButton(self.btn_frame, text="Get Unused Account", command=self.copy_unused, fg_color="blue")
        self.copy_btn.pack(side="left", padx=10)
        
        self.log_area = ctk.CTkTextbox(self, width=600, height=200)
        self.log_area.pack(pady=20)
        
        self.repeat_id = None

    def start_repeat(self, delta):
        self.change_count(delta)
        # Wait 400ms before starting fast repeat, then repeat every 100ms
        self.repeat_id = self.after(400, lambda: self.repeat_action(delta))

    def repeat_action(self, delta):
        self.change_count(delta)
        self.repeat_id = self.after(100, lambda: self.repeat_action(delta))

    def stop_repeat(self):
        if self.repeat_id:
            self.after_cancel(self.repeat_id)
            self.repeat_id = None

    def change_count(self, delta):
        try:
            current = int(self.count_entry.get())
            new_val = max(1, current + delta)
            self.count_entry.delete(0, "end")
            self.count_entry.insert(0, str(new_val))
        except:
            self.count_entry.delete(0, "end")
            self.count_entry.insert(0, "1")

    def log(self, text):
        self.log_area.insert("end", f"{text}\n")
        self.log_area.see("end")

    def copy_unused(self):
        email = self.db.get_unused_account()
        if email:
            pyperclip.copy(email)
            self.log(f"[+] Copied to clipboard: {email}")
        else:
            self.log("[-] No unused accounts for today.")

    def start_work(self):
        if self.is_running: return
        count = int(self.count_entry.get())
        self.is_running = True
        self.start_btn.configure(state="disabled", text="Running...")
        threading.Thread(target=self.run_async_loop, args=(count,), daemon=True).start()

    def run_async_loop(self, count):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.work(count))
        self.is_running = False
        self.start_btn.configure(state="normal", text="Start Creating")

    async def work(self, count):
        creator = WindsurfCreator(self.log, self.db)
        # Run in chunks of 10 for speed
        for i in range(0, count, 10):
            tasks = []
            chunk_size = min(10, count - i)
            for _ in range(chunk_size):
                tasks.append(creator.create_one())
            
            results = await asyncio.gather(*tasks)
            self.log(f"--- Finished chunk {(i//10) + 1} ---")
            
            # If any account failed in this chunk, wait 15s. Otherwise wait 5s.
            if False in results:
                await asyncio.sleep(15)
            else:
                await asyncio.sleep(5)

if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support() # Essential for EXEs
    install_dependencies()
    app = App()
    app.mainloop()
