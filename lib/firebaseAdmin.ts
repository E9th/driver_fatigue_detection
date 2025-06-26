// Re-export from the main firebase-admin module
export { auth, database } from "./firebase-admin"

// For backward compatibility, export a custom init function
export const customInitApp = () => {
  console.warn("customInitApp is deprecated, Firebase Admin is now initialized lazily")
}
