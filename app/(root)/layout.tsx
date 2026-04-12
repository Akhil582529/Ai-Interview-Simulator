import React, { ReactNode } from 'react'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/actions/auth.action'
import { is } from 'zod/locales'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'; 

const RootLayout = async ({children} : {children : ReactNode}) => {
  
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) {
    redirect('/sign-in');
  }

  return (
    <div className='root-layout'>
      <nav>
        <Link href="/" className='flex items-center gap-2'> </Link>
      </nav>
      {children}
    </div>
  )
}

export default RootLayout
