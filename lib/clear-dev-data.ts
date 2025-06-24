"use client"

// Utility function to clear development data
export const clearDevelopmentData = () => {
  if (typeof window !== "undefined") {
    console.log("🧹 Clearing development data from localStorage...")

    // Clear all development data
    localStorage.removeItem("dev-users")

    console.log("✅ Development data cleared successfully")

    // Reload the page to start fresh
    window.location.reload()
  }
}

// Function to check what's in localStorage
export const checkDevelopmentData = () => {
  if (typeof window !== "undefined") {
    const devUsers = localStorage.getItem("dev-users")
    console.log("🔍 Current development data:", devUsers ? JSON.parse(devUsers) : "No data")
    return devUsers ? JSON.parse(devUsers) : []
  }
  return []
}
