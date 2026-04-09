import React from 'react'
import dayjs from 'dayjs';
import { Button } from './ui/button';
import Link from 'next/link';
const InterviewCard = ({interviewId, userId, role, type, techstack, createdAt}: InterviewCardProps) => {
    const feedback = null as Feedback | null;
    const normalizedType = /mix/gi.test(type) ? "Mixed" : type;
    const formattedDate = dayjs(feedback ? feedback.createdAt : createdAt).format('MMM D, YYYY');
  return (
    <div className='border border-amber-50 w-[360px] h-50 rounded-2xl max-sm:w-full'>
    
        <div>
            <div className=''>
                <p className='flex bg-blue-900 rounded-3xl mt-2 w-25 justify-center ml-62'>{normalizedType}</p>
            </div>
            <div>
              <h3>
                {role} Interview
              </h3>
            </div>
            <div>
              <p>{formattedDate}</p>
            </div>
        
      </div>
      <div>
        <Button><Link href={feedback ? `/interview/${interviewId}/feedback` : `/interview/${interviewId}`}>
          {feedback ? "View Feedback" : "Take Interview"}
        </Link></Button>
      </div>
    </div>
  )
}

export default InterviewCard
