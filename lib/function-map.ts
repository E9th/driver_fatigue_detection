/**
 * Function Mapping and Data Source Documentation
 * Maps each function to its data source and purpose for easy debugging
 */

export interface FunctionMapping {
  function: string
  component: string
  dataSource: string
  firebasePath: string
  purpose: string
  updateFrequency: string
  cacheEnabled: boolean
  errorHandling: string[]
}

export const FUNCTION_MAP: FunctionMapping[] = [
  // Firebase Core Functions
  {
    function: "subscribeToCurrentData",
    component: "lib/firebase.ts",
    dataSource: "Firebase Realtime Database",
    firebasePath: "devices/{deviceId}/current_data",
    purpose: "Get real-time device status and sensor readings",
    updateFrequency: "Real-time (1-3 seconds)",
    cacheEnabled: false,
    errorHandling: ["Connection retry", "Fallback to null", "Error logging"],
  },
  {
    function: "subscribeToHistoricalData",
    component: "lib/firebase.ts",
    dataSource: "Firebase Realtime Database",
    firebasePath: "devices/{deviceId}/history",
    purpose: "Get historical data with date filtering",
    updateFrequency: "On query (cached for 5 minutes)",
    cacheEnabled: true,
    errorHandling: ["Connection retry", "Fallback to empty array", "Error logging"],
  },
  {
    function: "getDeviceCount",
    component: "lib/firebase.ts",
    dataSource: "Firebase Realtime Database",
    firebasePath: "devices/",
    purpose: "Count total devices in system",
    updateFrequency: "On demand",
    cacheEnabled: false,
    errorHandling: ["Return 0 on error", "Error logging"],
  },
  {
    function: "getActiveDeviceCount",
    component: "lib/firebase.ts",
    dataSource: "Firebase Realtime Database",
    firebasePath: "devices/",
    purpose: "Count devices active in last 5 minutes",
    updateFrequency: "On demand",
    cacheEnabled: false,
    errorHandling: ["Return 0 on error", "Error logging"],
  },
  {
    function: "getUsedDeviceIds",
    component: "lib/firebase.ts",
    dataSource: "Firebase Realtime Database",
    firebasePath: "users/",
    purpose: "Get list of assigned device IDs",
    updateFrequency: "On demand",
    cacheEnabled: false,
    errorHandling: ["Return empty array on error", "Error logging"],
  },

  // Authentication Functions
  {
    function: "registerUser",
    component: "lib/auth.ts",
    dataSource: "Firebase Auth + Realtime Database",
    firebasePath: "auth/ + users/{uid}",
    purpose: "Create new user account and profile",
    updateFrequency: "On registration",
    cacheEnabled: false,
    errorHandling: ["Auth error translation", "Device availability check", "Rollback on failure"],
  },
  {
    function: "loginUser",
    component: "lib/auth.ts",
    dataSource: "Firebase Auth",
    firebasePath: "auth/",
    purpose: "Authenticate user login",
    updateFrequency: "On login attempt",
    cacheEnabled: false,
    errorHandling: ["Auth error translation", "Development mode fallback"],
  },
  {
    function: "getUserProfile",
    component: "lib/auth.ts",
    dataSource: "Firebase Realtime Database",
    firebasePath: "users/{uid}",
    purpose: "Get user profile data",
    updateFrequency: "On auth state change",
    cacheEnabled: false,
    errorHandling: ["Return null on error", "Development mode fallback"],
  },
  {
    function: "getAllUsers",
    component: "lib/auth.ts",
    dataSource: "Firebase Realtime Database",
    firebasePath: "users/",
    purpose: "Get all users (Admin only)",
    updateFrequency: "On admin dashboard load",
    cacheEnabled: false,
    errorHandling: ["Return empty array on error", "Development mode fallback"],
  },

  // Data Service Functions
  {
    function: "subscribeToHistoricalDataWithCache",
    component: "lib/data-service.ts",
    dataSource: "Firebase Realtime Database + Cache",
    firebasePath: "devices/{deviceId}/history",
    purpose: "Get historical data with intelligent caching",
    updateFrequency: "Real-time with 5-minute cache",
    cacheEnabled: true,
    errorHandling: ["Cache fallback", "Empty data fallback", "Listener cleanup"],
  },
  {
    function: "calculateStats",
    component: "lib/data-service.ts",
    dataSource: "Processed historical data",
    firebasePath: "N/A (data processing)",
    purpose: "Calculate statistics from historical data",
    updateFrequency: "On data update",
    cacheEnabled: true,
    errorHandling: ["Return empty stats on error", "Data validation"],
  },
  {
    function: "generateReport",
    component: "lib/data-service.ts",
    dataSource: "Processed historical data",
    firebasePath: "N/A (data processing)",
    purpose: "Generate comprehensive analytics report",
    updateFrequency: "On demand",
    cacheEnabled: false,
    errorHandling: ["Return empty report on error", "Data validation"],
  },

  // Admin Analytics Functions
  {
    function: "getSystemStats",
    component: "lib/admin-analytics.ts",
    dataSource: "Multiple Firebase paths + processed data",
    firebasePath: "devices/ + users/ + historical data",
    purpose: "Get system-wide statistics for admin dashboard",
    updateFrequency: "On admin dashboard load",
    cacheEnabled: true,
    errorHandling: ["Partial data on errors", "Fallback to empty stats", "Error aggregation"],
  },
  {
    function: "getDeviceStats",
    component: "lib/admin-analytics.ts",
    dataSource: "Historical data + calculated metrics",
    firebasePath: "devices/{deviceId}/history",
    purpose: "Get statistics for individual device",
    updateFrequency: "On admin analytics request",
    cacheEnabled: true,
    errorHandling: ["Mock data fallback", "Risk score calculation", "Status determination"],
  },
]

/**
 * Find function mapping by function name
 */
export function getFunctionMapping(functionName: string): FunctionMapping | undefined {
  return FUNCTION_MAP.find((mapping) => mapping.function === functionName)
}

/**
 * Get all functions that use a specific Firebase path
 */
export function getFunctionsByPath(firebasePath: string): FunctionMapping[] {
  return FUNCTION_MAP.filter((mapping) => mapping.firebasePath.includes(firebasePath))
}

/**
 * Get all functions in a specific component
 */
export function getFunctionsByComponent(component: string): FunctionMapping[] {
  return FUNCTION_MAP.filter((mapping) => mapping.component === component)
}

/**
 * Get all cached functions
 */
export function getCachedFunctions(): FunctionMapping[] {
  return FUNCTION_MAP.filter((mapping) => mapping.cacheEnabled)
}

/**
 * Print function documentation for debugging
 */
export function printFunctionDoc(functionName: string): void {
  const mapping = getFunctionMapping(functionName)
  if (mapping) {
    console.log(`📋 Function: ${mapping.function}`)
    console.log(`📁 Component: ${mapping.component}`)
    console.log(`🔥 Firebase Path: ${mapping.firebasePath}`)
    console.log(`🎯 Purpose: ${mapping.purpose}`)
    console.log(`⏱️ Update Frequency: ${mapping.updateFrequency}`)
    console.log(`💾 Cache Enabled: ${mapping.cacheEnabled}`)
    console.log(`🛡️ Error Handling: ${mapping.errorHandling.join(", ")}`)
  } else {
    console.log(`❌ Function '${functionName}' not found in mapping`)
  }
}

console.log("📋 Function mapping initialized")
