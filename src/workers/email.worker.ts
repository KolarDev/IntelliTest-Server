// worker/email.worker.ts
import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.config';
import { Email } from '../services/email.service';
import { EMAIL_QUEUE_NAME, EmailJobData } from '../queues/email.queue'; 

// Create the worker that listens to the queue
const worker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job) => {
    // This function is executed by the worker when a job is picked up
    const { to, template, subject, contents } = job.data;
    
    console.log(`Processing email job for ${to} with template ${template}`);

    // Execute your original email sending logic
    await new Email(to, contents).send(template, subject);

    console.log(`Successfully sent email to ${to}.`);
  },
  { connection: redisConnection }
);

// Worker event handlers (optional but highly recommended for monitoring)
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});

console.log(`Email Worker listening for jobs in queue: ${EMAIL_QUEUE_NAME}`);

// Remember: This file needs to be run continuously in production!