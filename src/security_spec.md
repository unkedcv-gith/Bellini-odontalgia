# Security Specification & Threat Model: Bellini Dental Studio

## 1. Data Invariants
- **Cases (`/cases/{caseId}`)**:
  - Readable by anyone (publicly accessible portfolio).
  - Writeable (create, update, delete) ONLY by the authenticated administrator `mesfede@gmail.com` with a verified email address (`request.auth.token.email_verified == true`).
  - IDs must conform to alphanumeric characters, dashes, or underscores (`^[a-zA-Z0-9_\-]+$`) with a maximum length of 128 characters.
  - Creation payloads must possess strict keys: exact properties, proper types (strings for text, list/array of string for gallery), and bounded values.
  - Timestamps (`createdAt` / `updatedAt`) must follow temporal logic matching the server transaction time (`request.time`). `createdAt` is immutable.

---

## 2. The "Dirty Dozen" Threat Payloads (Blocked Vectors)

Below are the 12 malicious payloads designed to test compliance and security rules. All these payloads MUST return `PERMISSION_DENIED`:

1. **Anonymous / Unauthenticated Create**
   - Attempting to publish a new case without being signed in.
2. **Untrusted Collaborator Update**
   - Attempting to write a case using a authenticated token of a different email address (e.g. `stranger@example.com`).
3. **Admin Email Spoofing (Unverified)**
   - Attempting to write with email `mesfede@gmail.com` but with `email_verified: false` in the token.
4. **ID Poisoning / Denial of Wallet**
   - Attempting to create a document with an extremely long ID containing malicious scripts or junk characters.
5. **Ghost Field Injection (Shadow Update)**
   - Attempting to inject unmapped properties (e.g., `isAdmin: true` or `isFeaturedAdminCase: true`) to bypass schema boundaries.
6. **Immutable Field Tampering**
   - Attempting to mutate `createdAt` or any immutable property after document creation.
7. **Client-Controlled Timestamp Exploitation**
   - Attempting to pass custom, fake timestamps in `createdAt` or `updatedAt` rather than `request.time`.
8. **Invalid Entity Schema (String Sizes)**
   - Infiltrating the database with massive string assets (e.g., 2MB text in the `category` property) to overload readers.
9. **Value Poisoning (Data Type Mismatch)**
   - Attempting to pass a Boolean value or a Number for `title` or a single String instead of a List/Array for `galleryImages`.
10. **Array Overloading (Denial of Wallet)**
    - Attempting to insert a `galleryImages` list with 500+ URLs to exploit system resources.
11. **Malicious Empty Payload**
    - Creating blank registry keys without required properties (`name`, `category`, `desc`, `challenge`, `solution`).
12. **Unauthorized Deletion**
    - Unauthorized user attempt to delete clinical cases.

---

## 3. Test Runner Invariant (Dry Run Validation)
A pseudo testing suite validating authorization blocks:
```typescript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe("Bellini Portfolio Security", () => {
  it("blocks unauthenticated writes", async () => {
    const db = getUnauthenticatedDb();
    await assertFails(db.collection('cases').add({ name: "Malicious Case" }));
  });

  it("blocks non-authorized verified users", async () => {
    const db = getAuthenticatedDb({ email: "tester@gmail.com", email_verified: true });
    await assertFails(db.collection('cases').add({ name: "Hack Case" }));
  });

  it("blocks unverified admin email session", async () => {
    const db = getAuthenticatedDb({ email: "mesfede@gmail.com", email_verified: false });
    await assertFails(db.collection('cases').add({ name: "Hack Case" }));
  });

  it("permits verified owner (mesfede@gmail.com) to write compliant schemas", async () => {
    const db = getAuthenticatedDb({ email: "mesfede@gmail.com", email_verified: true });
    await assertSucceeds(db.collection('cases').doc('case_1').set({
      category: "Estética",
      tabLabel: "Caso Oclusivo",
      name: "Caso 1",
      desc: "Reconstrucción completa",
      challenge: "Desgaste severo",
      solution: "Carillas refractarias",
      material: "Porcelana",
      duration: "2 sesiones",
      beforeImg: "https://example.com/before.jpg",
      afterImg: "https://example.com/after.jpg",
      galleryImages: ["https://example.com/step1.jpg"],
      doctorNotes: "Excelente sellado",
      createdAt: "SERVER_TIMESTAMP"
    }));
  });
});
```
