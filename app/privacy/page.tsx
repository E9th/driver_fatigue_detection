import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">นโยบายความเป็นส่วนตัว</h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-4">
            บริษัท ไดรเวอร์ เฟทีก ดีเทคชั่น จำกัด ("บริษัท") ให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายความเป็นส่วนตัวนี้อธิบายวิธีที่เราเก็บรวบรวม
            ใช้ และเปิดเผยข้อมูลส่วนบุคคลของคุณ เมื่อคุณใช้แอปพลิเคชัน Driver Fatigue Detection ของเรา
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">1. ข้อมูลที่เราเก็บรวบรวม</h2>
          <p>เราอาจเก็บรวบรวมข้อมูลต่อไปนี้:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>ข้อมูลส่วนบุคคล: ชื่อ-นามสกุล, อีเมล, หมายเลขโทรศัพท์, เลขใบขับขี่</li>
            <li>ข้อมูลอุปกรณ์: Device ID, ข้อมูลการใช้งานอุปกรณ์</li>
            <li>ข้อมูลการใช้งาน: สถิติการใช้งาน, ข้อมูลการเตือนความเหนื่อยล้า</li>
            <li>ข้อมูลภาพ: ภาพใบหน้าที่ใช้ในการตรวจจับความเหนื่อยล้า (ไม่มีการจัดเก็บถาวร)</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
          <p>เราใช้ข้อมูลของคุณเพื่อ:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>ให้บริการและปรับปรุงระบบ Driver Fatigue Detection</li>
            <li>ตรวจจับและเตือนความเหนื่อยล้าขณะขับขี่</li>
            <li>วิเคราะห์พฤติกรรมการขับขี่และสร้างรายงานสถิติ</li>
            <li>ติดต่อสื่อสารกับคุณเกี่ยวกับบริการของเรา</li>
            <li>ปฏิบัติตามกฎหมายและข้อบังคับที่เกี่ยวข้อง</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">3. การเปิดเผยข้อมูล</h2>
          <p>เราอาจเปิดเผยข้อมูลของคุณให้กับ:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>พนักงานและผู้ให้บริการที่จำเป็นต้องเข้าถึงข้อมูลเพื่อให้บริการ</li>
            <li>บริษัทขนส่งหรือนายจ้างของคุณ (กรณีที่คุณเป็นพนักงานขับรถ)</li>
            <li>หน่วยงานรัฐที่มีอำนาจตามกฎหมาย</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">4. การรักษาความปลอดภัย</h2>
          <p className="mb-4">
            เราใช้มาตรการรักษาความปลอดภัยทางเทคนิคและทางกายภาพที่เหมาะสมเพื่อปกป้องข้อมูลส่วนบุคคลของคุณ จากการเข้าถึง การใช้
            หรือการเปิดเผยโดยไม่ได้รับอนุญาต
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">5. สิทธิของคุณ</h2>
          <p>คุณมีสิทธิ์:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>เข้าถึงข้อมูลส่วนบุคคลของคุณ</li>
            <li>แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
            <li>ลบข้อมูลของคุณ (ภายใต้เงื่อนไขบางประการ)</li>
            <li>คัดค้านหรือจำกัดการประมวลผลข้อมูลของคุณ</li>
            <li>ขอรับสำเนาข้อมูลของคุณ</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">6. การเปลี่ยนแปลงนโยบาย</h2>
          <p className="mb-4">
            เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลเมื่อเราโพสต์นโยบายฉบับแก้ไขบนแอปพลิเคชัน
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">7. ติดต่อเรา</h2>
          <p className="mb-4">หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ โปรดติดต่อเราที่ privacy@driverfatigue.co.th</p>
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/">กลับสู่หน้าหลัก</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
