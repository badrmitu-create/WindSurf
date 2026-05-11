"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Zap, Shield, Rocket } from "lucide-react";

export function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-glow-gradient opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1),transparent_50%)]" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              Multi-threaded Automation
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Automate Account</span>
            <br />
            Creation at Scale
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Powerful, efficient, and secure account automation. Create multiple 
            accounts simultaneously with intelligent concurrency control and 
            real-time monitoring.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/dashboard")}>
              <Rocket className="w-5 h-5" />
              Launch Dashboard
            </Button>
            <Button variant="secondary" size="lg" onClick={() => {
              const el = document.getElementById("features");
              el?.scrollIntoView({ behavior: "smooth" });
            }}>
              <Shield className="w-5 h-5" />
              Learn More
            </Button>
          </div>
        </motion.div>
        
        <motion.div
          id="features"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="card text-center">
            <div className="text-3xl font-bold text-accent mb-2">10x</div>
            <div className="text-sm text-zinc-400">Faster Creation</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success mb-2">100%</div>
            <div className="text-sm text-zinc-400">Success Rate</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-info mb-2">24/7</div>
            <div className="text-sm text-zinc-400">Automated</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
