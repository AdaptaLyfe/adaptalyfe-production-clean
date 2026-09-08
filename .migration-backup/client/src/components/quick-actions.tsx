import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Smile, Calendar, CheckSquare, Users } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="mb-8">
      <h3 className="text-3xl font-bold text-gray-800 mb-6 drop-shadow-sm">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Link href="/mood-tracking">
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 h-auto flex-col space-y-3"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Smile className="text-white" size={28} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 text-lg">Mood Check-in</h4>
              <p className="text-sm text-gray-700 font-medium">How are you feeling?</p>
            </div>
          </Button>
        </Link>
        
        <Link href="/financial">
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 h-auto flex-col space-y-3"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="text-white" size={28} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 text-lg">Bill Reminders</h4>
              <p className="text-sm text-gray-700 font-medium">Manage payments</p>
            </div>
          </Button>
        </Link>
        
        <Link href="/daily-tasks">
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-green-200 hover:border-green-400 hover:shadow-2xl transition-all duration-300 h-auto flex-col space-y-3"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckSquare className="text-white" size={28} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 text-lg">Daily Tasks</h4>
              <p className="text-sm text-gray-700 font-medium">Complete activities</p>
            </div>
          </Button>
        </Link>
        
        <Link href="/caregiver">
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-2xl transition-all duration-300 h-auto flex-col space-y-3"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="text-white" size={28} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 text-lg">Contact Support</h4>
              <p className="text-sm text-gray-700 font-medium">Reach out for help</p>
            </div>
          </Button>
        </Link>
      </div>
    </div>
  );
}
