import { task } from "@trigger.dev/sdk/v3";
import { emailService } from "@/lib/email-service";

export const sendMachineNotification = task({
  id: "send-machine-notification",
  run: async (payload: { machineName: string; machineOs: string; machineDifficulty: string }) => {
    await emailService.sendNewMachineNotification(payload.machineName, payload.machineOs, payload.machineDifficulty);
    return { success: true };
  },
});

export const sendWriteupNotification = task({
  id: "send-writeup-notification",
  run: async (payload: { writeupTitle: string; platform: string; category: string; difficulty: string }) => {
    await emailService.sendNewWriteupNotification(payload.writeupTitle, payload.platform, payload.category, payload.difficulty);
    return { success: true };
  },
});
