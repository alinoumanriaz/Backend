CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `role` ENUM('customer', 'admin', 'manager') DEFAULT 'customer',
  `userImage` VARCHAR(255) DEFAULT '/assets/images/userPlaceholder.jpg',
  `isVerified` BOOLEAN DEFAULT FALSE,
  `verificationToken` VARCHAR(255) DEFAULT NULL,
  `verificationTokenExpiry` DATETIME DEFAULT NULL,
  `forgetPasswordToken` VARCHAR(255) DEFAULT NULL,
  `forgetPasswordTokenExpiry` DATETIME DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `image` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `imageUrl` VARCHAR(255) NOT NULL,
  `imageAlt` VARCHAR(255) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
)

CREATE TABLE `product_image` (
  `id`   INT AUTO_INCREMENT PRIMARY KEY,
  `productId` INT NOT NULL,
  `imageUrl` VARCHAR(255) NOT NULL,
  `imageAlt` VARCHAR(255) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE
)

CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `parentCategoryId` INT DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `imageId` INT NOT NULL,
  `iconId` INT NOT NULL,
  `description` TEXT DEFAULT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  FOREIGN KEY (`imageId`) REFERENCES `images` (`id`)
  FOREIGN KEY (`iconId`) REFERENCES `images` (`id`)
  FOREIGN KEY (`parentCategoryId`) REFERENCES `categories` (`id`)
);

CREATE TABLE `brands` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `imageId` INT NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`imageId`) REFERENCES `images` (`id`)
)

CREATE TABLE `product_categories` (
  `productId` INT NOT NULL,
  `categoryId` INT NOT NULL,
  PRIMARY KEY (`productId`, `categoryId`),
  FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE
);


CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `brandId` INT DEFAULT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `stock` INT NOT NULL,
  `status` ENUM('draft', 'published') DEFAULT 'draft',
  `salePrice` DECIMAL(10, 2) DEFAULT NULL,
  `isFeatured` BOOLEAN DEFAULT FALSE,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  FOREIGN key (`brandId`) REFERENCES `brands` (`id`)
);


-- Orders table
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `totalAmount` DECIMAL(10, 2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `shippingAddressId` INT NOT NULL,
  `paymentMethod` VARCHAR(50) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`shippingAddressId`) REFERENCES `shipping_addresses`(`id`)
);

-- Order Items table (many-to-many relationship between orders and products)
CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL,
  `productId` INT NOT NULL,
  `quantity` INT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE
);


-- Wishlist table (one-to-one relation between user and wishlist)
-- CREATE TABLE `wishlists` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `userId` INT NOT NULL,
--   `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
--   `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
-- );

-- Wishlist Items table (many-to-many relationship between wishlist and products)
CREATE TABLE `wishlist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `productId` INT NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE
);

-- Shipping Addresses table (one-to-many relation with users)
CREATE TABLE `shipping_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `fullname` VARCHAR(255) NOT NULL,
  `street` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `state` VARCHAR(255) NOT NULL,
  `postalCode` VARCHAR(50) NOT NULL,
  `country` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Payment table (one-to-one relation with orders)
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL UNIQUE,
  `method` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE
);

-- Reviews table (one-to-many relation with users and products)
CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `productId` INT NOT NULL,
  `images` 
  `rating` INT NOT NULL,
  `comment` TEXT,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`),
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE
);

CREATE TABLE `review_images`(
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reviewId` INT NOT NULL,
  `imagesUrl` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reviewId`) REFERENCES `review` (`id`) ON DELETE CASCADE
)


ALTER TABLE `subcategories`
ADD COLUMN `parentId` INT DEFAULT NULL,
ADD CONSTRAINT `fk_subcategory_parent` 
    FOREIGN KEY (`parentId`) 
    REFERENCES `subcategories`(`id`) 
    ON DELETE CASCADE;  




