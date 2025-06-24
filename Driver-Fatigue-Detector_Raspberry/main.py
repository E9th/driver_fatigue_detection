#!/usr/bin/env python3
"""
Driver Fatigue Detection System - Main Application
Enhanced with notification system
"""

import sys
import os
import time
import threading
import signal
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import core modules
from core.detector import FatigueDetector
from core.firebase import initialize_firebase, cleanup_firebase
from core.sound import SoundManager
from core.notification_handler import notification_handler, initialize_notification_handler, cleanup_notification_handler

# Import GUI modules
from gui.gui_main import FatigueDetectionGUI

class DriverFatigueDetectionSystem:
    def __init__(self):
        self.detector = None
        self.gui = None
        self.sound_manager = None
        self.running = False
        self.threads = []
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        print(f"\n🛑 Received signal {signum}, shutting down gracefully...")
        self.shutdown()
        
    def initialize(self):
        """Initialize all system components"""
        try:
            print("🚀 Initializing Driver Fatigue Detection System...")
            
            # Initialize Firebase connection
            print("🔥 Initializing Firebase...")
            if not initialize_firebase():
                print("❌ Failed to initialize Firebase")
                return False
                
            # Initialize notification handler
            print("🔔 Initializing notification handler...")
            initialize_notification_handler()
            
            # Initialize sound manager
            print("🔊 Initializing sound manager...")
            self.sound_manager = SoundManager()
            
            # Initialize fatigue detector
            print("👁️ Initializing fatigue detector...")
            self.detector = FatigueDetector()
            if not self.detector.initialize():
                print("❌ Failed to initialize fatigue detector")
                return False
                
            # Initialize GUI
            print("🖥️ Initializing GUI...")
            self.gui = FatigueDetectionGUI(self.detector, self.sound_manager)
            
            print("✅ System initialization completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error during initialization: {e}")
            return False
    
    def start(self):
        """Start the main system"""
        if not self.initialize():
            print("❌ System initialization failed, exiting...")
            return False
            
        try:
            self.running = True
            print("🎯 Starting Driver Fatigue Detection System...")
            
            # Start detector in a separate thread
            detector_thread = threading.Thread(target=self._run_detector, daemon=True)
            detector_thread.start()
            self.threads.append(detector_thread)
            
            # Start GUI (this will block until GUI is closed)
            print("🖥️ Starting GUI interface...")
            self.gui.run()
            
            return True
            
        except Exception as e:
            print(f"❌ Error starting system: {e}")
            return False
        finally:
            self.shutdown()
    
    def _run_detector(self):
        """Run the fatigue detector in a loop"""
        print("👁️ Fatigue detector started...")
        
        while self.running:
            try:
                if self.detector:
                    # Process one frame
                    self.detector.process_frame()
                    
                # Small delay to prevent excessive CPU usage
                time.sleep(0.01)  # 100 FPS max
                
            except Exception as e:
                print(f"❌ Error in detector loop: {e}")
                time.sleep(1)  # Wait before retrying
                
        print("👁️ Fatigue detector stopped")
    
    def shutdown(self):
        """Shutdown all system components gracefully"""
        if not self.running:
            return
            
        print("🛑 Shutting down Driver Fatigue Detection System...")
        self.running = False
        
        try:
            # Stop notification handler
            print("🔔 Stopping notification handler...")
            cleanup_notification_handler()
            
            # Stop detector
            if self.detector:
                print("👁️ Stopping fatigue detector...")
                self.detector.cleanup()
                
            # Stop sound manager
            if self.sound_manager:
                print("🔊 Stopping sound manager...")
                self.sound_manager.cleanup()
                
            # Stop GUI
            if self.gui:
                print("🖥️ Stopping GUI...")
                self.gui.cleanup()
                
            # Wait for threads to finish
            print("⏳ Waiting for threads to finish...")
            for thread in self.threads:
                if thread.is_alive():
                    thread.join(timeout=5)
                    
            # Cleanup Firebase
            print("🔥 Cleaning up Firebase...")
            cleanup_firebase()
            
            print("✅ System shutdown completed successfully!")
            
        except Exception as e:
            print(f"❌ Error during shutdown: {e}")

def main():
    """Main entry point"""
    print("=" * 60)
    print("🚗 Driver Fatigue Detection System v2.0")
    print("🔔 Enhanced with Notification System")
    print("=" * 60)
    
    # Create and start the system
    system = DriverFatigueDetectionSystem()
    
    try:
        success = system.start()
        if success:
            print("✅ System completed successfully")
        else:
            print("❌ System failed to start")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()
