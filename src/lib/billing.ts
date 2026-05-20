import { prisma } from "./prisma";
import { PLANS, type PlanType, type PlanConfig } from "./billing-plans";

export { PLANS, CREDIT_PACKS, CREDIT_COSTS, type PlanType, type PlanConfig } from "./billing-plans";

export async function getUserPlan(_userId: string): Promise<PlanType> {
  // Paywalls disabled: every user is treated as Pro.
  return "pro";
}

export async function getUserPlanConfig(userId: string): Promise<PlanConfig> {
  const plan = await getUserPlan(userId);
  return PLANS[plan];
}

export async function getDailyMessageCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.message.count({
    where: {
      userId,
      role: "user",
      createdAt: { gte: today },
    },
  });
}

export async function canSendMessage(_userId: string): Promise<{ allowed: boolean; remaining: number; plan: PlanType }> {
  // Paywalls disabled: unlimited messages.
  return { allowed: true, remaining: -1, plan: "pro" };
}

export async function canUseFeature(
  _userId: string,
  _feature: keyof Pick<PlanConfig, "hasVoice" | "hasPhotos" | "hasMoodDiary" | "hasGoodnight" | "hasMemory" | "hasExternalLink" | "hasHealing">
): Promise<boolean> {
  // Paywalls disabled: every feature is available.
  return true;
}

export async function getCredits(_userId: string): Promise<number> {
  // Paywalls disabled: effectively unlimited credits.
  return Number.MAX_SAFE_INTEGER;
}

export async function useCredits(_userId: string, _amount: number, _description: string): Promise<boolean> {
  // Paywalls disabled: credit spend is a no-op.
  return true;
}

export async function addCredits(
  userId: string,
  amount: number,
  description: string,
  payment?: {
    provider?: string;
    stripePaymentId?: string;
    creemCheckoutId?: string;
    creemOrderId?: string;
    creemTransactionId?: string;
    creemSubscriptionId?: string;
    status?: string;
  }
): Promise<void> {
  await prisma.$transaction([
    prisma.creditBalance.upsert({
      where: { userId },
      update: { balance: { increment: amount } },
      create: { userId, balance: amount },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "credit_purchase",
        amount: 0,
        credits: amount,
        description,
        provider: payment?.provider,
        stripePaymentId: payment?.stripePaymentId,
        creemCheckoutId: payment?.creemCheckoutId,
        creemOrderId: payment?.creemOrderId,
        creemTransactionId: payment?.creemTransactionId,
        creemSubscriptionId: payment?.creemSubscriptionId,
        status: payment?.status || "completed",
      },
    }),
  ]);
}

export async function hasProcessedCreemCheckout(checkoutId: string): Promise<boolean> {
  const transaction = await prisma.transaction.findUnique({
    where: { creemCheckoutId: checkoutId },
    select: { id: true },
  });

  return Boolean(transaction);
}

export async function hasProcessedCreemTransaction(transactionId: string): Promise<boolean> {
  const transaction = await prisma.transaction.findUnique({
    where: { creemTransactionId: transactionId },
    select: { id: true },
  });

  return Boolean(transaction);
}

export async function recordCreemSubscriptionPayment(input: {
  userId: string;
  plan: PlanType;
  amount: number;
  description: string;
  checkoutId?: string | null;
  orderId?: string | null;
  transactionId?: string | null;
  subscriptionId?: string | null;
  status?: string;
}): Promise<void> {
  await prisma.transaction.create({
    data: {
      userId: input.userId,
      type: "subscription",
      amount: input.amount,
      description: input.description,
      provider: "creem",
      creemCheckoutId: input.checkoutId || undefined,
      creemOrderId: input.orderId || undefined,
      creemTransactionId: input.transactionId || undefined,
      creemSubscriptionId: input.subscriptionId || undefined,
      status: input.status || "completed",
    },
  });
}

export async function markCreemTransactionStatus(
  transactionId: string,
  status: string
): Promise<void> {
  await prisma.transaction.updateMany({
    where: { OR: [{ creemTransactionId: transactionId }, { creemOrderId: transactionId }] },
    data: { status },
  });
}

export async function markSubscriptionTransactionsStatus(
  subscriptionId: string,
  status: string
): Promise<void> {
  await prisma.transaction.updateMany({
    where: { creemSubscriptionId: subscriptionId },
    data: { status },
  });
}

export async function findUserIdByCreemCustomerId(customerId: string): Promise<string | null> {
  const sub = await prisma.subscription.findFirst({
    where: { creemCustomerId: customerId },
    select: { userId: true },
  });

  return sub?.userId || null;
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id || null;
}

export async function upsertSubscriptionRecord(input: {
  userId: string;
  plan: PlanType;
  status: string;
  creemCustomerId?: string | null;
  creemSubscriptionId?: string | null;
  creemProductId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { userId: input.userId },
    select: { id: true },
  });

  if (existing) {
    await prisma.subscription.update({
      where: { userId: input.userId },
      data: {
        plan: input.plan,
        status: input.status,
        creemCustomerId: input.creemCustomerId || undefined,
        creemSubscriptionId: input.creemSubscriptionId || undefined,
        creemProductId: input.creemProductId || undefined,
        currentPeriodStart: input.currentPeriodStart,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
      },
    });
    return;
  }

  await prisma.subscription.create({
    data: {
      userId: input.userId,
      plan: input.plan,
      status: input.status,
      creemCustomerId: input.creemCustomerId || undefined,
      creemSubscriptionId: input.creemSubscriptionId || undefined,
      creemProductId: input.creemProductId || undefined,
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
    },
  });
}
