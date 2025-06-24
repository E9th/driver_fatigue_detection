import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md">
        
        {/* --- ส่วนหัวเรื่อง --- */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">สำหรับผลิตภัณฑ์ต้นแบบเพื่อการวิจัยและพัฒนา</p>
          <h1 className="text-3xl font-bold mt-2">ข้อตกลงการใช้งานและข้อจำกัดความรับผิดชอบ</h1>
          <p className="text-muted-foreground mt-2">ผลิตภัณฑ์: AI ตรวจจับความเหนื่อยล้าสำหรับคนขับขี่ (Driver Fatigue Detector)</p>
          <p className="text-xs text-muted-foreground mt-1">ฉบับล่าสุด: 24 มิถุนายน 2568</p>
        </div>

        {/* --- เนื้อหาข้อตกลง --- */}
        <div className="prose dark:prose-invert max-w-none space-y-6">
          
          <h2 className="text-xl font-semibold border-b pb-2">บทนำ</h2>
          <p>
            ข้อตกลงฉบับนี้ใช้บังคับกับการที่ท่าน ("ผู้ใช้") เข้าถึงและใช้งานผลิตภัณฑ์ต้นแบบ "AI ตรวจจับความเหนื่อยล้าสำหรับคนขับขี่" 
            ซึ่งประกอบด้วยอุปกรณ์ฮาร์ดแวร์และแอปพลิเคชัน ("ระบบ") ที่พัฒนาโดยคณะผู้จัดทำ ระบบนี้ถูกสร้างขึ้นเพื่อวัตถุประสงค์ในการวิจัยและพัฒนาเทคโนโลยีปัญญาประดิษฐ์ 
            การที่ท่านเข้าใช้งานระบบนี้ ถือว่าท่านได้อ่าน ทำความเข้าใจ และยอมรับเงื่อนไขและข้อจำกัดความรับผิดชอบทั้งหมดในข้อตกลงนี้
          </p>

          <h2 className="text-xl font-semibold border-b pb-2">1. เกี่ยวกับผลิตภัณฑ์</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>สถานะผลิตภัณฑ์:</strong> ท่านรับทราบว่าระบบนี้เป็น <strong>ผลิตภัณฑ์ต้นแบบ (Prototype)</strong> ที่แม้จะผ่านการทดสอบในสภาวะจริง แต่ยังคงอยู่ในขั้นตอนการวิจัยและพัฒนา อาจมีข้อผิดพลาดหรือการทำงานที่ไม่สมบูรณ์เกิดขึ้นได้
            </li>
            <li>
              <strong>วัตถุประสงค์:</strong> เป้าหมายหลักของผลิตภัณฑ์นี้คือการพิสูจน์แนวคิด (Proof of Concept) และเก็บข้อมูลเพื่อการวิเคราะห์และสรุปผลในฐานะโครงงานวิจัยระดับปริญญาตรี ไม่ได้มีวัตถุประสงค์เพื่อการจำหน่ายเชิงพาณิชย์
            </li>
          </ul>

          <h2 className="text-xl font-semibold border-b pb-2">2. เงื่อนไขการใช้งาน</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>การใช้งานที่ถูกต้อง:</strong> ท่านตกลงที่จะใช้ระบบตามคำแนะนำที่ให้ไว้ และใช้เพื่อการประเมินผลส่วนบุคคลเท่านั้น
            </li>
            <li>
              <strong>การลงทะเบียน:</strong> ข้อมูลที่ใช้ในการลงทะเบียน เช่น ชื่อ, อีเมล, และใบขับขี่ จะถูกใช้เพื่อระบุตัวตนผู้ใช้และผูกกับอุปกรณ์เท่านั้น
            </li>
            <li>
              <strong>ความเป็นเจ้าของ:</strong> ท่านตกลงที่จะไม่ดัดแปลง, ทำซ้ำ, หรือพยายามทำวิศวกรรมย้อนกลับ (Reverse Engineering) ส่วนใดส่วนหนึ่งของระบบ
            </li>
          </ul>

          <h2 className="text-xl font-semibold border-b pb-2 text-red-600 dark:text-red-500">3. ข้อจำกัดความรับผิดชอบและความปลอดภัย (สำคัญอย่างยิ่ง)</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>ไม่ใช่เครื่องมือช่วยชีวิต:</strong> ระบบนี้เป็นเพียง <strong>เครื่องมือช่วยเสริม</strong> เพื่อแจ้งเตือนความเป็นไปได้ของความเหนื่อยล้า <strong>ห้ามใช้ทดแทน</strong> วิจารณญาณ, สติ, ความระมัดระวัง, และความสามารถในการควบคุมยานพาหนะของผู้ขับขี่โดยเด็ดขาด
            </li>
            <li>
              <strong>ความรับผิดชอบของผู้ใช้:</strong> ความปลอดภัยในการขับขี่ยังคงเป็นความรับผิดชอบสูงสุดของผู้ใช้แต่เพียงผู้เดียว การพักผ่อนให้เพียงพอและการปฏิบัติตามกฎจราจรเป็นสิ่งจำเป็นเสมอ
            </li>
            <li>
              <strong>ไม่มีการรับประกัน:</strong> คณะผู้จัดทำไม่รับประกันความถูกต้องแม่นยำของการแจ้งเตือน 100% และไม่รับผิดชอบต่อความเสียหาย, การบาดเจ็บ, หรืออุบัติเหตุใดๆ ที่เกิดขึ้น ไม่ว่าจะเกี่ยวข้องกับการทำงานหรือข้อผิดพลาดของระบบหรือไม่ก็ตาม
            </li>
          </ul>
          
          <h2 className="text-xl font-semibold border-b pb-2">4. ข้อมูลและการตอบกลับ</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>การเก็บข้อมูล:</strong> ระบบจะมีการเก็บข้อมูลการใช้งานเพื่อนำไปวิเคราะห์และปรับปรุงประสิทธิภาพ ซึ่งข้อมูลเหล่านี้จะถูกใช้เพื่อการศึกษาเท่านั้น ท่านสามารถอ่านรายละเอียดเพิ่มเติมได้ที่หน้า <Link href="/privacy" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</Link>
            </li>
            <li>
              <strong>การให้ข้อมูลตอบกลับ:</strong> คณะผู้จัดทำยินดีรับฟังข้อเสนอแนะหรือรายงานปัญหาที่ท่านพบเจอ เพื่อเป็นประโยชน์ต่อการพัฒนาโครงงานให้สำเร็จลุล่วง
            </li>
          </ul>

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold">คณะผู้จัดทำ</h3>
            <p className="text-muted-foreground">
              นายธนพล ดงภูยาว<br/>
              นายพัชระ อัลอุมารี<br/>
              นายดิศรณ์ ศุภประทุม
            </p>
            <h3 className="text-lg font-semibold mt-4">อาจารย์ที่ปรึกษา</h3>
            <p className="text-muted-foreground">
              ผศ.ดร.กัมพล พรหมจิระประวัติ
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button asChild>
            <Link href="/">กลับสู่หน้าหลัก</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
