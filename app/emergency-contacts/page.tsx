"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const loadContacts = useCallback(async () => {
    try {
      const response = await fetch("/api/emergency-contacts", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load emergency contacts.");
      }

      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to load contacts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  async function addContact() {
    if (!name.trim() || !phone.trim()) {
      setStatus("Please enter a name and phone number.");
      return;
    }

    setBusy(true);
    setStatus("Saving contact...");

    try {
      const response = await fetch("/api/emergency-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save contact.");
      }

      setName("");
      setPhone("");
      await loadContacts();
      setStatus("Emergency contact saved.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to save contact."
      );
    } finally {
      setBusy(false);
    }
  }

  function startEditing(contact: Contact) {
    setEditingId(contact.id);
    setEditName(contact.name);
    setEditPhone(contact.phone);
    setStatus("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
  }

  async function saveContact(id: string) {
    if (!editName.trim() || !editPhone.trim()) {
      setStatus("Name and phone number are required.");
      return;
    }

    setBusy(true);
    setStatus("Updating contact...");

    try {
      const response = await fetch(
        `/api/emergency-contacts/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            phone: editPhone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update contact.");
      }

      cancelEditing();
      await loadContacts();
      setStatus("Emergency contact updated.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to update contact."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteContact(contact: Contact) {
    const confirmed = window.confirm(
      `Delete ${contact.name} from your emergency contacts?`
    );

    if (!confirmed) return;

    setBusy(true);
    setStatus("Deleting contact...");

    try {
      const response = await fetch(
        `/api/emergency-contacts/${encodeURIComponent(contact.id)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete contact.");
      }

      if (editingId === contact.id) {
        cancelEditing();
      }

      await loadContacts();
      setStatus("Emergency contact deleted.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to delete contact."
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400";

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/profile" className="font-bold text-emerald-400">
          ← Back to Profile
        </Link>

        <h1 className="mt-8 text-3xl font-black sm:text-4xl">
          Emergency Contacts
        </h1>

        <p className="mt-3 text-white/60">
          Save and manage trusted emergency contact details.
        </p>

        <section
          id="add-contact"
          className="mt-8 scroll-mt-8 space-y-4 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-6"
        >
          <h2 className="text-xl font-bold">Add Emergency Contact</h2>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contact name"
            aria-label="New contact name"
            className={inputClass}
          />

          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number e.g. +44..."
            aria-label="New contact phone number"
            className={inputClass}
          />

          <button
            type="button"
            onClick={addContact}
            disabled={busy}
            className="w-full rounded-full bg-emerald-600 px-6 py-4 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Please wait..." : "Add Emergency Contact"}
          </button>
        </section>

        <section id="manage-contacts" className="mt-10 scroll-mt-8 space-y-4">
          <h2 className="text-xl font-bold">Manage Emergency Contacts</h2>

          {status && (
            <p role="status" className="text-sm text-emerald-300">
              {status}
            </p>
          )}

          {loading ? (
            <p className="text-white/60">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-white/60">No emergency contacts saved yet.</p>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                {editingId === contact.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      aria-label="Edit contact name"
                      className={inputClass}
                    />

                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(event) => setEditPhone(event.target.value)}
                      aria-label="Edit contact phone number"
                      className={inputClass}
                    />

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => saveContact(contact.id)}
                        disabled={busy}
                        className="rounded-full bg-emerald-600 px-5 py-3 font-bold disabled:opacity-50"
                      >
                        Save Changes
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={busy}
                        className="rounded-full border border-white/20 px-5 py-3 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="font-bold">{contact.name}</p>
                      <p className="mt-1 text-white/60">{contact.phone}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => startEditing(contact)}
                        disabled={busy}
                        className="rounded-full border border-emerald-500/50 px-5 py-3 font-semibold text-emerald-300 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteContact(contact)}
                        disabled={busy}
                        className="rounded-full border border-red-500/40 px-5 py-3 font-semibold text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
