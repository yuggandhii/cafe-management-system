const { z } = require('zod');

const posConfigSchema = z.object({
  name: z.string().min(1, 'Name required'),
  enable_cash: z.boolean().optional().default(true),
  enable_digital: z.boolean().optional().default(false),
  enable_upi: z.boolean().optional().default(false),
  upi_id: z.string().nullable().optional(),
});

module.exports = { posConfigSchema };
