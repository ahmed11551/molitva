import { z } from "zod";

const isoDateSchema = z
  .string()
  .min(5)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Ожидается валидная дата ISO"
  });

const madhabSchema = z.enum(["hanafi", "shafii"]);

export const personalDataSchema = z
  .object({
    birth_date: isoDateSchema,
    gender: z.enum(["male", "female"]),
    bulugh_age: z.number().int().min(9).max(18).optional(),
    prayer_start_date: isoDateSchema.optional(),
    today_as_start: z.boolean().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.today_as_start && !value.prayer_start_date) {
      ctx.addIssue({
        code: "custom",
        message:
          "Укажите prayer_start_date или включите флаг today_as_start"
      });
    }
  });

export const womenDataSchema = z
  .object({
    haid_days_per_month: z.number().int().min(0).max(15).default(7),
    childbirth_count: z.number().int().min(0).default(0),
    nifas_days_per_childbirth: z.number().int().min(0).default(40)
  })
  .partial()
  .default({});

export const travelPeriodSchema = z.object({
  start_date: isoDateSchema,
  end_date: isoDateSchema,
  days_count: z.number().int().min(0).optional()
});

export const travelDataSchema = z
  .object({
    total_travel_days: z.number().int().min(0).optional(),
    travel_periods: z.array(travelPeriodSchema).optional()
  })
  .superRefine((value, ctx) => {
    if (!value?.travel_periods || value.travel_periods.length === 0) {
      return;
    }

    // Проверка пересечений периодов
    const periods = value.travel_periods;
    for (let i = 0; i < periods.length; i++) {
      const period1 = periods[i];
      if (!period1.start_date || !period1.end_date) continue;

      const start1 = new Date(period1.start_date);
      const end1 = new Date(period1.end_date);

      if (end1 < start1) {
        ctx.addIssue({
          code: "custom",
          path: ["travel_periods", i, "end_date"],
          message: "Дата окончания не может быть раньше даты начала"
        });
        continue;
      }

      // Проверка пересечений с другими периодами
      for (let j = i + 1; j < periods.length; j++) {
        const period2 = periods[j];
        if (!period2.start_date || !period2.end_date) continue;

        const start2 = new Date(period2.start_date);
        const end2 = new Date(period2.end_date);

        if ((start1 <= end2 && end1 >= start2) || (start2 <= end1 && end2 >= start1)) {
          ctx.addIssue({
            code: "custom",
            path: ["travel_periods", i],
            message: `Период ${i + 1} пересекается с периодом ${j + 1}`
          });
          ctx.addIssue({
            code: "custom",
            path: ["travel_periods", j],
            message: `Период ${j + 1} пересекается с периодом ${i + 1}`
          });
        }
      }
    }
  })
  .optional();

const MAX_TOTAL_DAYS = 80 * 365;

export const calculationSchema = z.object({
  calculation_method: z.enum(["manual", "calculator"]),
  madhab: madhabSchema.optional(),
  personal_data: personalDataSchema,
  women_data: womenDataSchema.optional(),
  travel_data: travelDataSchema
}).superRefine((value, ctx) => {
  // Валидация total_days <= 80 * 365
  // Это будет проверяться на уровне сервиса после расчёта
  // Здесь можно добавить предварительную проверку, если известна дата рождения
  if (value.personal_data.birth_date) {
    const birthDate = new Date(value.personal_data.birth_date);
    const today = new Date();
    const yearsDiff = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (yearsDiff > 80) {
      ctx.addIssue({
        code: "custom",
        path: ["personal_data", "birth_date"],
        message: `Период расчёта не может превышать 80 лет. Текущий возраст: ${Math.floor(yearsDiff)} лет`
      });
    }
  }
});

export const progressEntrySchema = z.object({
  type: z.enum([
    "fajr",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
    "witr",
    "dhuhr_safar",
    "asr_safar",
    "isha_safar"
  ]),
  amount: z
    .number()
    .int()
    .refine((value) => value !== 0, {
      message: "amount не может быть 0"
    })
    .max(500)
    .min(-500)
});

export const progressSchema = z.object({
  entries: z.array(progressEntrySchema).min(1)
});

export const webhookPayloadSchema = z.object({
  job_id: z.string().min(5),
  status: z.enum(["pending", "done", "error"]),
  result: z.unknown().optional(),
  error: z.string().optional()
});

export type CalculationSchemaInput = z.infer<typeof calculationSchema>;
export type ProgressSchemaInput = z.infer<typeof progressSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;


