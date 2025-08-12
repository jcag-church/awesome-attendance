import AttendanceApp from "@/components/attendance";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-dvh bg-white">
      <div className="container mx-auto p-4 md:p-8">
        <AttendanceApp />
      </div>
    </main>
  );
}
