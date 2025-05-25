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



CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `parentCategoryId` INT DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  FOREIGN KEY (`parentCategoryId`) REFERENCES `categories` (`id`)
);
CREATE TABLE `category_images`(
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `categoryId` INT DEFAULT NULL,
  `imageUrl` VARCHAR(255) NOT NULL,
  `imageAlt` VARCHAR(255) NOT NULL,
  FOREIGN key (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE
)
CREATE TABLE `fabric` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE `fabric_images`(
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fabricId` INT DEFAULT NULL,
  `imageUrl` VARCHAR(255) NOT NULL,
  `imageAlt` VARCHAR(255) NOT NULL,
  FOREIGN key (`fabricId`) REFERENCES `fabric`(`id`) ON DELETE CASCADE
)

CREATE TABLE `product_categories` (
  `productId` INT NOT NULL,
  `categoryId` INT NOT NULL,
  PRIMARY KEY (`productId`, `categoryId`),
  FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE
);
CREATE TABLE `product_fabrics` (
  `productId` INT NOT NULL,
  `fabricId` INT NOT NULL,
  PRIMARY KEY (`productId`, `fabricId`),
  FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fabricId`) REFERENCES `fabric` (`id`) ON DELETE CASCADE
);


CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('draft', 'published') DEFAULT 'draft',
  `fabric` VARCHAR(255),
  `gender` ENUM('men','women','kids') DEFAULT 'men',
  `isFeatured` BOOLEAN DEFAULT FALSE,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `product_variants` (
  `variantId` INT AUTO_INCREMENT PRIMARY KEY,
  `productId` INT NOT NULL,
  `colorName` VARCHAR(100) NOT NULL,
  `colorCode` VARCHAR(100) NOT NULL,
  `sizes` JSON,
  `price` INT NOT NULL,
  `salePrice` INT DEFAULT NULL,
  `stock` INT NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE
);

CREATE TABLE `product_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `productId` INT NOT NULL,
  `variantId` INT NOT NULL,
  `imageUrl` VARCHAR(255) NOT NULL,
  `altText` VARCHAR(255) NOT NULL,
  `isMain` BOOLEAN,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`variantId`) ON DELETE CASCADE
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE
)

-- Orders table
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `username` VARCHAR(255),
  `email` VARCHAR(255),
  `phoneNumber` VARCHAR(20),
  `cardHolderName` VARCHAR(255),
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `stripePaymentId` VARCHAR(255),
  `paymentDeductedAmount` DECIMAL(10,2),
  `stripePaymentStatus` VARCHAR(255),
  `paymentDate` TIMESTAMP,
  `orderStatus` ENUM('Pending', 'succeeded', 'Failed') DEFAULT 'Pending',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);



-- Order Items table (many-to-many relationship between orders and products)
CREATE TABLE `order_items` (
  `order_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL,
  `productId` INT NOT NULL,
  `productSlug` VARCHAR(255),
  `productName` VARCHAR(255),
  `productImage` VARCHAR(255),
  `size` VARCHAR(10),
  `color` VARCHAR(255),
  `gender` VARCHAR(10),
  `quantity` INT NOT NULL,
  `unitPrice` INT NOT NULL,
  `totalPrice` INT NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`)
);

CREATE TABLE `shipping_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT,
  `userId` INT,
  `fullname` VARCHAR(255) NOT NULL,
  `street` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `state` VARCHAR(255) NOT NULL,
  `postalCode` VARCHAR(50) NOT NULL,
  `country` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50),
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
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


CREATE TABLE `brand_images`(
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `imageUrl` VARCHAR(255) NOT NULL,
  `imageAlt` VARCHAR(255) NOT NULL,
)

CREATE TABLE `category_images`(
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `imageUrl` VARCHAR(255) NOT NULL,
  `imageAlt` VARCHAR(255) NOT NULL,
)

CREATE TABLE `product_color`(
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `colorName` VARCHAR(255) not null,
  `colorCode` VARCHAR(255) not null,
)


ALTER TABLE product
ADD COLUMN color_id INT,                
ADD CONSTRAINT fk_product_color        
FOREIGN KEY (color_id)                  
REFERENCES product_color(color_id);  



