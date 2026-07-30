import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    // Interfeys v1 da faqat o'zbekcha, lekin baza ko'p tillilikka tayyor
    name: {
      uz: { type: String, required: true, trim: true },
      ru: { type: String, default: '', trim: true },
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, default: null }, // lucide ikonka nomi yoki svg fayl
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, order: 1 });

export const Category = mongoose.model('Category', categorySchema);
export default Category;
