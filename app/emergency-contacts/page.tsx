"use client";

import { useEffect, useState } from "react";

type Contact = {
  id: string;
  name: string;
  phone: string;
};

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");

  async function loadContacts() {
    const response = await fetch("/api/emergency-contacts");
    const data = await response.json();
    setContacts(data.contacts || []);
  }

  async function addContact() {
    setStatus("Saving...");

    const response = await fetch("/api/emergency-contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Failed to save contact.");
      return;
    }

    setName("");
    setPhone("");
    setStatus("Emergency contact saved.");
    loadContacts();
  }

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="font-bold text-emerald-400">
          ← Back Home
        </a>

        <h1 className="mt-8 text-4xl font-black">Emergency Contacts</h1>

        <p className="mt-3 text-white/60">
          Add trusted phone numbers to be alerted when SOS is triggered.
        </p>

        <div className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number e.g. +234..."
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
          />

          <button
            onClick={addContact}
            className="w-full rounded-full bg-red-500 px-6 py-4 font-black text-white"
          >
            Add Emergency Contact
          </button>

          {status && <p className="text-sm text-white/60">{status}</p>}
        </div>

        <div className="mt-8 space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <p className="font-bold">{contact.name}</p>
              <p className="text-white/50">{contact.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}