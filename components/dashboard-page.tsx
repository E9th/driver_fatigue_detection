"use client"
import { Button } from "@/components/ui/button"

const DashboardPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Welcome</h2>
        <p>Welcome to your dashboard! This is where you can manage your account and access various features.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Account Overview</h2>
        {/* Add account overview information here */}
        <p>Account information will be displayed here.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
        <div className="flex space-x-4">
          <Button>Update Profile</Button>
          <Button>Change Password</Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Debug Panel</h2>
        <div className="flex space-x-4">
          <Button variant="outline" size="sm" onClick={() => window.open("/", "_blank")} className="text-xs">
            Go to Landing
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("/register", "_blank")} className="text-xs">
            Register Page
          </Button>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
