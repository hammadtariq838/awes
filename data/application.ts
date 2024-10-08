'use server';

import { db } from '@/lib/db';
import {
  Step1Schema,
  Step2Schema,
  Step3Schema,
  AdminDocumentsSchema,
} from '@/schemas/application';
import { z } from 'zod';
import { ApplicationStep } from '@prisma/client';
import { currentUser } from '@/lib/auth';

export const getApplicationByApplicationId = async (
  applicationId: string
) => {
  const application = await db.application.findUnique({
    where: { id: applicationId },
  });

  return application;
};

export const getOrCreateApplication = async (
  userId: string
) => {
  let application = await db.application.findUnique({
    where: { userId: userId },
  });

  if (!application) {
    application = await db.application.create({
      data: {
        userId: userId,
      },
    });
  }

  return application;
};

export const handleStep1 = async (
  applicationId: string,
  step1Data: z.infer<typeof Step1Schema>
) => {
  return await db.application.update({
    where: { id: applicationId },
    data: step1Data,
  });
};

export const handleStep2 = async (
  applicationId: string,
  step2Data: z.infer<typeof Step2Schema>
) => {
  return await db.application.update({
    where: { id: applicationId },
    data: step2Data,
  });
};

export const handleStep3 = async (
  applicationId: string,
  step3Data: z.infer<typeof Step3Schema>
) => {
  return await db.$transaction(async (prisma) => {
    await prisma.childrenDetail.deleteMany({
      where: { applicationId },
    });

    await prisma.spouseDetail.deleteMany({
      where: { applicationId },
    });

    return await prisma.application.update({
      where: { id: applicationId },
      data: {
        ...step3Data,
        childrenDetails: {
          create: step3Data.childrenDetails,
        },
        spouseDetails: {
          create: step3Data.spouseDetails,
        },
      },
    });
  });
};

export const handleAdminDocuments = async (
  applicationId: string,
  adminDocumentsData: z.infer<typeof AdminDocumentsSchema>
) => {
  return await db.application.update({
    where: { id: applicationId },
    data: adminDocumentsData,
  });
};

export const addFeedback = async (
  applicationId: string,
  feedback: string
) => {
  const feedbackData = {
    feedback,
  };
  return await db.application.update({
    where: { id: applicationId },
    data: feedbackData,
  });
};

export const getApplicationStep = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const applicationStep = await db.application.findUnique({
    where: { userId: user.id },
    select: { applicationStep: true },
  });

  return applicationStep;
};

export const getUserApplication = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const userApplication = await db.user.findUnique({
    where: { id: user.id },
    include: {
      application: true,
    },
  });

  return userApplication;
};
