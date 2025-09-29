#!/usr/bin/env python3
import asyncio
from telethon import TelegramClient
import os

async def fix_connection():
    print("بدء إصلاح اتصال التليجرام...")
    
    # بياناتك الخاصة
    api_id = 22043994
    api_hash = '56f64582b363d367280db96586b97801'
    phone = '+967774523876'
    
    client = TelegramClient('monitor_session', api_id, api_hash)
    
    try:
        await client.connect()
        print("تم الاتصال بخدمة التليجرام")
        
        if not await client.is_user_authorized():
            print("جلسة غير مصرّح بها، طلب رمز التحقق...")
            await client.send_code_request(phone)
            code = input('الرجاء إدخال الرمز الذي وصلك على التليجرام: ')
            await client.sign_in(phone, code)
            print("تم تسجيل الدخول بنجاح")
        else:
            print("الجلسة لا تزال صالحة")
        
        # اختبار الإرسال
        await client.send_message('me', '✅ تم إصلاح نظام المراقبة بنجاح')
        print("تم اختبار الإرسال بنجاح")
        
        await client.disconnect()
        print("✅ تم الانتهاء من الإصلاح بنجاح")
        return True
        
    except Exception as e:
        print(f"❌ خطأ أثناء الإصلاح: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(fix_connection())
