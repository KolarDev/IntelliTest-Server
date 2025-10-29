import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.config';

const connection = new Redis(redisConnection);

connection.on('connect', () => {
    console.log('✅ Redis connection for PRODUCER successful.');
});

connection.on('error', (err) => {
    console.error('❌ Redis connection error for PRODUCER:', err);
});

// Define the name of the queue
export const EMAIL_QUEUE_NAME = 'emailQueue';

// Interface for the job data payload
export interface EmailJobData {
  to: string;
  template: string;
  subject: string;
  // This will hold the contents object from your original Email constructor
  contents: { 
    user?: any; 
    extraData?: { [key: string]: any; } 
  };           
}



// Create the single queue instance for publishing jobs
export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  // connection: redisConnection,
  connection: connection,
  // Default options for all jobs in this queue
  defaultJobOptions: {
    attempts: 3, // Retry a failed job 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 seconds delay
    },
    removeOnComplete: true, // Clean up successful jobs
    removeOnFail: 1000,      // Keep last 1000 failed jobs for inspection
  }
});
