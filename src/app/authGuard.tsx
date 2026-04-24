"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Firebase session observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        // Agar user login nahi hai aur wo login page par bhi nahi hai
        if (pathname !== "/login" && pathname !== "/signup") {
          router.push("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="h-screen h-full w-full flex items-center justify-center bg-[#000D1A]">
        <Loader2 className="animate-spin text-green-500 mb-4" size={45} />
        <p className="text-gray-400 animate-pulse">Verifying Session...</p>
      </div>
    );
  }

  return <>{children}</>;
}