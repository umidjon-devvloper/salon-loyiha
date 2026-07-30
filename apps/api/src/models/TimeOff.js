import mongoose from 'mongoose';
import { MINUTES_IN_DAY, isValidDateStr } from '@gozal/shared/utils/time';

const { Schema } = mongoose;

const timeOffSchema = new Schema(
  {
    salon: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },

    /** null = butun salon yopiq (bayram). Aks holda — aynan shu usta */
    master: { type: Schema.Types.ObjectId, ref: 'Master', default: null },

    dateFrom: {
      type: String,
      required: true,
      validate: [isValidDateStr, "Sana 'YYYY-MM-DD' ko'rinishida bo'lishi kerak"],
    },
    dateTo: {
      type: String,
      required: true,
      validate: [isValidDateStr, "Sana 'YYYY-MM-DD' ko'rinishida bo'lishi kerak"],
    },

    allDay: { type: Boolean, default: true },
    startMin: { type: Number, default: null, min: 0, max: MINUTES_IN_DAY },
    endMin: { type: Number, default: null, min: 0, max: MINUTES_IN_DAY },

    reason: { type: String, default: '', maxlength: 200 }, // 'Ta'til', 'Bayram'
  },
  { timestamps: true },
);

timeOffSchema.pre('validate', function () {
  if (this.dateTo < this.dateFrom) {
    throw new Error("Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas");
  }
  if (!this.allDay) {
    if (this.startMin === null || this.endMin === null) {
      throw new Error("Kun bo'yi emas bo'lsa, boshlanish va tugash vaqti kerak");
    }
    if (this.endMin <= this.startMin) {
      throw new Error("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak");
    }
  }
});

// Slot hisoblashda: salon + (master yoki null) + sana oralig'i
timeOffSchema.index({ salon: 1, master: 1, dateFrom: 1, dateTo: 1 });

export const TimeOff = mongoose.model('TimeOff', timeOffSchema);
export default TimeOff;
