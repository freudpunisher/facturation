import { relations } from "drizzle-orm"
import { mysqlTable, varchar, text, int, decimal, boolean, timestamp, primaryKey, json } from "drizzle-orm/mysql-core"

// Products table
export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  image: varchar("image", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  isNew: boolean("is_new").default(false),
  isBestseller: boolean("is_bestseller").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
})

// Categories table
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
})

// Brands table
export const brands = mysqlTable("brands", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
})

// Carousel/Slider images for homepage
export const carouselImages = mysqlTable("carousel_images", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }),
  subtitle: varchar("subtitle", { length: 255 }),
  imageUrl: varchar("image_url", { length: 255 }).notNull(),
  order: int("order").notNull(),
  active: boolean("active").default(true),
})

// Team members for About page
export const teamMembers = mysqlTable("team_members", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  bio: text("bio"),
  imageUrl: varchar("image_url", { length: 255 }),
  order: int("order").default(0),
})

// Company milestones for About page
export const milestones = mysqlTable("milestones", {
  id: int("id").primaryKey().autoincrement(),
  year: varchar("year", { length: 10 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").default(0),
})

// Company values for About page
export const companyValues = mysqlTable("company_values", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  order: int("order").default(0),
})

// Contact information
export const contactInfo = mysqlTable("contact_info", {
  id: int("id").primaryKey().autoincrement(),
  type: varchar("type", { length: 50 }).notNull(), // address, email, phone, hours
  value: text("value").notNull(),
  icon: varchar("icon", { length: 100 }),
  order: int("order").default(0),
})

// FAQ items
export const faqItems = mysqlTable("faq_items", {
  id: int("id").primaryKey().autoincrement(),
  question: varchar("question", { length: 255 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }),
  order: int("order").default(0),
})

// About page content
export const aboutContent = mysqlTable("about_content", {
  id: int("id").primaryKey().autoincrement(),
  section: varchar("section", { length: 100 }).notNull(), // hero, story, why-choose-us
  title: varchar("title", { length: 255 }),
  content: text("content"),
  imageUrl: varchar("image_url", { length: 255 }),
})

// shops
export const shops = mysqlTable("shops", {
  id:  int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  address: varchar("address", { length: 255 }).notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  images: json("images").$type<string[]>().default([]),
  hours: varchar("hours", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  features: json("features").$type<string[]>().default([]),
  location: varchar("location", { length: 50 }).notNull().default("local"), // 'local' or 'international'
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

//shop staff
export const shopStaff = mysqlTable("shop_staff", {
  id: int("id").primaryKey().autoincrement(),
  shopId: int("shop_id").references(() => shops.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  imagePath: varchar("image_path", { length: 255 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
//publicite
export const publiciteVideos = mysqlTable("publicite_videos", {
  id:int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoPath: varchar("video_path", { length: 255 }).notNull(),
  thumbnailPath: varchar("thumbnail_path", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull().default("promotional"), // 'promotional' or 'workplace'
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  categories: many(productToCategory),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(productToCategory),
}))

// Many-to-many relation between products and categories
export const productToCategory = mysqlTable(
  "product_to_category",
  {
    productId: int("product_id").notNull(),
    categoryId: int("category_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.categoryId] }),
  }),
)

export const productToCategoryRelations = relations(productToCategory, ({ one }) => ({
  product: one(products, {
    fields: [productToCategory.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productToCategory.categoryId],
    references: [categories.id],
  }),
}))
