-- ============================================================================
-- QuickCatalog - PostgreSQL 16 Database Initialization Script
-- ============================================================================
-- This script initializes the complete database schema, triggers, and seed
-- data for the QuickCatalog product catalog management application.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 2. ENUM TYPES
-- ============================================================================

CREATE TYPE subscription_plan AS ENUM ('FREE', 'STARTER', 'PRO');

CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

CREATE TYPE gst_rate AS ENUM ('GST_0', 'GST_5', 'GST_12', 'GST_18', 'GST_28');

CREATE TYPE barcode_type AS ENUM ('EAN13', 'UPC', 'CUSTOM', 'NONE');

CREATE TYPE unit_type AS ENUM (
    'PCS', 'KG', 'GM', 'LTR', 'ML', 'MTR', 'CM',
    'BOX', 'SET', 'PAIR', 'DOZEN', 'PACK', 'ROLL',
    'SQ_FT', 'SQ_MTR'
);

CREATE TYPE product_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

CREATE TYPE entity_type AS ENUM ('PRODUCT', 'CATEGORY', 'CHANNEL', 'IMPORT', 'USER');

CREATE TYPE action_type AS ENUM (
    'CREATED', 'UPDATED', 'DELETED',
    'PUBLISHED', 'UNPUBLISHED', 'STATUS_CHANGED'
);

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- tenant
-- --------------------------------------------------------------------------
CREATE TABLE tenant (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name            VARCHAR(255) NOT NULL,
    gstin                   VARCHAR(15),
    phone                   VARCHAR(15),
    email                   VARCHAR(255),
    logo_url                VARCHAR(500),
    default_currency        VARCHAR(3) DEFAULT 'INR',
    subscription_plan       subscription_plan DEFAULT 'FREE',
    subscription_valid_until TIMESTAMP,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- "user" (quoted - reserved word)
-- --------------------------------------------------------------------------
CREATE TABLE "user" (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenant(id),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(15),
    role            user_role DEFAULT 'VIEWER',
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- category (self-referencing tree)
-- --------------------------------------------------------------------------
CREATE TABLE category (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenant(id),
    name                VARCHAR(255) NOT NULL,
    parent_id           UUID REFERENCES category(id) ON DELETE SET NULL,
    hsn_code_default    VARCHAR(10),
    default_gst_rate    gst_rate,
    attributes_schema   JSONB DEFAULT '[]'::jsonb,
    sort_order          INT DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_category_tenant_id ON category(tenant_id);
CREATE INDEX idx_category_parent_id ON category(parent_id);

-- --------------------------------------------------------------------------
-- product (core entity)
-- --------------------------------------------------------------------------
CREATE TABLE product (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenant(id),
    category_id         UUID REFERENCES category(id),
    name                VARCHAR(500) NOT NULL,
    slug                VARCHAR(500),
    short_description   VARCHAR(200),
    long_description    TEXT,
    brand               VARCHAR(255),
    manufacturer        VARCHAR(255),
    hsn_code            VARCHAR(10),
    sac_code            VARCHAR(10),
    gst_rate            gst_rate DEFAULT 'GST_18',
    sku                 VARCHAR(100),
    barcode_type        barcode_type DEFAULT 'NONE',
    barcode_value       VARCHAR(50),
    mrp                 DECIMAL(12,2),
    selling_price       DECIMAL(12,2),
    cost_price          DECIMAL(12,2),
    unit                unit_type DEFAULT 'PCS',
    weight_grams        DECIMAL(10,2),
    length_cm           DECIMAL(8,2),
    width_cm            DECIMAL(8,2),
    height_cm           DECIMAL(8,2),
    track_inventory     BOOLEAN DEFAULT FALSE,
    current_stock       DECIMAL(12,2) DEFAULT 0,
    low_stock_threshold INT,
    custom_attributes   JSONB DEFAULT '{}'::jsonb,
    tags                TEXT[] DEFAULT '{}',
    seo_title           VARCHAR(255),
    seo_description     VARCHAR(500),
    seo_keywords        TEXT[] DEFAULT '{}',
    status              product_status DEFAULT 'DRAFT',
    is_featured         BOOLEAN DEFAULT FALSE,
    created_by          UUID REFERENCES "user"(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    search_vector       tsvector
);

CREATE INDEX idx_product_tenant_id ON product(tenant_id);
CREATE INDEX idx_product_category_id ON product(category_id);
CREATE INDEX idx_product_tenant_status ON product(tenant_id, status);
CREATE INDEX idx_product_tenant_sku ON product(tenant_id, sku);
CREATE INDEX idx_product_barcode_value ON product(barcode_value);
CREATE INDEX idx_product_tenant_slug ON product(tenant_id, slug);
CREATE INDEX idx_product_search_vector ON product USING GIN(search_vector);
CREATE INDEX idx_product_name_trgm ON product USING GIN(name gin_trgm_ops);

-- --------------------------------------------------------------------------
-- product_image
-- --------------------------------------------------------------------------
CREATE TABLE product_image (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    original_url    VARCHAR(500) NOT NULL,
    thumbnail_url   VARCHAR(500),
    medium_url      VARCHAR(500),
    large_url       VARCHAR(500),
    alt_text        VARCHAR(255),
    is_primary      BOOLEAN DEFAULT FALSE,
    sort_order      INT DEFAULT 0,
    bg_removed_url  VARCHAR(500),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_image_product_id ON product_image(product_id);

-- --------------------------------------------------------------------------
-- activity_log
-- --------------------------------------------------------------------------
CREATE TABLE activity_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenant(id),
    user_id     UUID REFERENCES "user"(id),
    entity_type entity_type NOT NULL,
    entity_id   UUID NOT NULL,
    action      action_type NOT NULL,
    details     JSONB DEFAULT '{}',
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_log_tenant_id ON activity_log(tenant_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_tenant_created ON activity_log(tenant_id, created_at DESC);

-- --------------------------------------------------------------------------
-- hsn_master (global lookup - no tenant_id)
-- --------------------------------------------------------------------------
CREATE TABLE hsn_master (
    code        VARCHAR(10) PRIMARY KEY,
    description VARCHAR(500) NOT NULL,
    gst_rate    gst_rate,
    chapter     VARCHAR(100)
);

CREATE INDEX idx_hsn_master_fulltext ON hsn_master USING GIN(
    to_tsvector('english', description || ' ' || code)
);
CREATE INDEX idx_hsn_master_description_trgm ON hsn_master USING GIN(description gin_trgm_ops);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- --------------------------------------------------------------------------
-- Product search vector auto-update trigger
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION product_search_vector_update()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.hsn_code, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_search_vector_update
    BEFORE INSERT OR UPDATE ON product
    FOR EACH ROW
    EXECUTE FUNCTION product_search_vector_update();

-- --------------------------------------------------------------------------
-- Generic updated_at timestamp trigger
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenant_updated_at
    BEFORE UPDATE ON tenant
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_category_updated_at
    BEFORE UPDATE ON category
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_product_updated_at
    BEFORE UPDATE ON product
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. SEED DATA
-- ============================================================================

-- --------------------------------------------------------------------------
-- 5.1 Default Tenant
-- --------------------------------------------------------------------------
INSERT INTO tenant (id, company_name, email, phone, gstin, subscription_plan)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Nandi Crafts',
    'admin@nandicrafts.in',
    '9876543210',
    '29AABCU9603R1ZM',
    'PRO'
);

-- --------------------------------------------------------------------------
-- 5.2 Default Admin User
-- --------------------------------------------------------------------------
INSERT INTO "user" (id, tenant_id, name, email, password_hash, role)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Admin User',
    'admin@quickcatalog.com',
    '$2a$10$SolT/3DGTHtaznsYZuzjGOSSBa6jkGJ/7RnYpbIhV2/pi99SxfTyy',
    'OWNER'
);

-- --------------------------------------------------------------------------
-- 5.3 HSN Master Data (~100 codes)
-- --------------------------------------------------------------------------
INSERT INTO hsn_master (code, description, gst_rate, chapter) VALUES

-- Chapter 04: Dairy Products
('0401', 'Milk and cream, not concentrated', 'GST_0', 'Chapter 04 - Dairy Products'),
('0402', 'Milk and cream, concentrated or sweetened', 'GST_5', 'Chapter 04 - Dairy Products'),
('0403', 'Buttermilk, curdled milk and cream, yogurt, kephir', 'GST_5', 'Chapter 04 - Dairy Products'),
('0405', 'Butter and other fats and oils derived from milk', 'GST_12', 'Chapter 04 - Dairy Products'),
('0406', 'Cheese and curd', 'GST_12', 'Chapter 04 - Dairy Products'),

-- Chapter 09: Coffee, Tea, Spices
('0904', 'Pepper of the genus Piper; dried or crushed capsicum and pimenta', 'GST_5', 'Chapter 09 - Coffee, Tea, Spices'),
('0908', 'Nutmeg, mace and cardamom', 'GST_5', 'Chapter 09 - Coffee, Tea, Spices'),
('0909', 'Seeds of anise, badian, fennel, coriander, cumin, caraway or juniper', 'GST_5', 'Chapter 09 - Coffee, Tea, Spices'),
('0910', 'Ginger, saffron, turmeric, thyme, bay leaves, curry and other spices', 'GST_5', 'Chapter 09 - Coffee, Tea, Spices'),

-- Chapter 10: Cereals
('1001', 'Wheat and meslin', 'GST_0', 'Chapter 10 - Cereals'),
('1005', 'Maize (corn)', 'GST_0', 'Chapter 10 - Cereals'),
('1006', 'Rice', 'GST_5', 'Chapter 10 - Cereals'),

-- Chapter 17-21: Food Products
('1701', 'Cane or beet sugar and chemically pure sucrose', 'GST_5', 'Chapter 17 - Sugars and Sugar Confectionery'),
('1704', 'Sugar confectionery not containing cocoa', 'GST_18', 'Chapter 17 - Sugars and Sugar Confectionery'),
('1806', 'Chocolate and other food preparations containing cocoa', 'GST_18', 'Chapter 18 - Cocoa and Cocoa Preparations'),
('1901', 'Malt extract; food preparations of flour, groats, meal, starch or malt extract', 'GST_18', 'Chapter 19 - Preparations of Cereals'),
('1902', 'Pasta, cooked or stuffed or otherwise prepared; couscous', 'GST_12', 'Chapter 19 - Preparations of Cereals'),
('1905', 'Bread, pastry, cakes, biscuits and other bakers wares', 'GST_18', 'Chapter 19 - Preparations of Cereals'),
('2009', 'Fruit juices and vegetable juices, unfermented', 'GST_12', 'Chapter 20 - Preparations of Vegetables and Fruit'),
('2101', 'Extracts, essences and concentrates of coffee, tea or mate', 'GST_18', 'Chapter 21 - Miscellaneous Edible Preparations'),
('2106', 'Food preparations not elsewhere specified', 'GST_18', 'Chapter 21 - Miscellaneous Edible Preparations'),

-- Chapter 33: Essential Oils, Perfumery, Cosmetics
('3301', 'Essential oils; resinoids; extracted oleoresins', 'GST_18', 'Chapter 33 - Essential Oils and Cosmetics'),
('3303', 'Perfumes and toilet waters', 'GST_28', 'Chapter 33 - Essential Oils and Cosmetics'),
('3304', 'Beauty or make-up preparations; skin care preparations', 'GST_28', 'Chapter 33 - Essential Oils and Cosmetics'),
('3305', 'Hair care preparations including shampoos', 'GST_18', 'Chapter 33 - Essential Oils and Cosmetics'),
('3306', 'Preparations for oral or dental hygiene, including toothpaste', 'GST_18', 'Chapter 33 - Essential Oils and Cosmetics'),
('3307', 'Shaving preparations, deodorants, bath preparations, depilatories', 'GST_28', 'Chapter 33 - Essential Oils and Cosmetics'),

-- Chapter 39: Plastics and Articles Thereof
('3922', 'Baths, shower-baths, sinks, wash-basins, bidets, lavatory seats of plastics', 'GST_18', 'Chapter 39 - Plastics and Articles Thereof'),
('3923', 'Articles for the conveyance or packing of goods, of plastics', 'GST_18', 'Chapter 39 - Plastics and Articles Thereof'),
('3924', 'Tableware, kitchenware, other household articles and hygienic articles of plastics', 'GST_18', 'Chapter 39 - Plastics and Articles Thereof'),
('3926', 'Other articles of plastics and articles of other materials', 'GST_18', 'Chapter 39 - Plastics and Articles Thereof'),

-- Chapter 42: Leather Articles
('4202', 'Trunks, suitcases, vanity cases, briefcases, handbags, wallets of leather', 'GST_18', 'Chapter 42 - Articles of Leather'),
('4203', 'Articles of apparel and clothing accessories of leather or composition leather', 'GST_12', 'Chapter 42 - Articles of Leather'),

-- Chapter 44: Wood and Articles of Wood
('4415', 'Packing cases, boxes, crates, drums and similar packings of wood', 'GST_18', 'Chapter 44 - Wood and Articles of Wood'),
('4418', 'Builders joinery and carpentry of wood, including panels, shingles', 'GST_18', 'Chapter 44 - Wood and Articles of Wood'),
('4419', 'Tableware and kitchenware of wood', 'GST_12', 'Chapter 44 - Wood and Articles of Wood'),
('4420', 'Wood marquetry, inlaid wood; caskets, cases, statuettes and ornaments of wood', 'GST_12', 'Chapter 44 - Wood and Articles of Wood'),
('4421', 'Other articles of wood such as clothes hangers, spools, bobbins', 'GST_18', 'Chapter 44 - Wood and Articles of Wood'),

-- Chapter 46: Manufactures of Straw, Basketware
('4601', 'Plaits and similar products of plaiting materials, whether or not assembled into strips', 'GST_5', 'Chapter 46 - Manufactures of Straw and Basketware'),
('4602', 'Basketwork, wickerwork and other articles made of plaiting materials', 'GST_12', 'Chapter 46 - Manufactures of Straw and Basketware'),

-- Chapter 48: Paper and Paperboard
('4818', 'Toilet paper, handkerchiefs, towels, tablecloths, napkins of paper', 'GST_18', 'Chapter 48 - Paper and Paperboard'),
('4819', 'Cartons, boxes, cases, bags and other packing containers of paper', 'GST_18', 'Chapter 48 - Paper and Paperboard'),
('4820', 'Registers, account books, notebooks, diaries, memo pads, letter pads', 'GST_18', 'Chapter 48 - Paper and Paperboard'),
('4821', 'Paper or paperboard labels of all kinds, whether or not printed', 'GST_12', 'Chapter 48 - Paper and Paperboard'),

-- Chapter 52: Cotton
('5208', 'Woven fabrics of cotton, containing 85% or more by weight of cotton, not exceeding 200 g/m2', 'GST_5', 'Chapter 52 - Cotton'),
('5209', 'Woven fabrics of cotton, containing 85% or more by weight of cotton, exceeding 200 g/m2', 'GST_5', 'Chapter 52 - Cotton'),
('5210', 'Woven fabrics of cotton, containing less than 85% by weight of cotton, not exceeding 200 g/m2', 'GST_5', 'Chapter 52 - Cotton'),
('5211', 'Woven fabrics of cotton, containing less than 85% by weight of cotton, exceeding 200 g/m2', 'GST_5', 'Chapter 52 - Cotton'),
('5212', 'Other woven fabrics of cotton', 'GST_5', 'Chapter 52 - Cotton'),

-- Chapter 61: Articles of Apparel, Knitted or Crocheted
('6101', 'Mens or boys overcoats, car-coats, capes, cloaks and similar articles, knitted', 'GST_12', 'Chapter 61 - Knitted Garments'),
('6102', 'Womens or girls overcoats, car-coats, capes, cloaks and similar articles, knitted', 'GST_12', 'Chapter 61 - Knitted Garments'),
('6103', 'Mens or boys suits, ensembles, jackets, blazers, trousers, knitted', 'GST_12', 'Chapter 61 - Knitted Garments'),
('6104', 'Womens or girls suits, ensembles, jackets, dresses, skirts, knitted', 'GST_12', 'Chapter 61 - Knitted Garments'),
('6105', 'Mens or boys shirts, knitted or crocheted', 'GST_5', 'Chapter 61 - Knitted Garments'),
('6106', 'Womens or girls blouses, shirts and shirt-blouses, knitted', 'GST_5', 'Chapter 61 - Knitted Garments'),
('6109', 'T-shirts, singlets and other vests, knitted or crocheted', 'GST_5', 'Chapter 61 - Knitted Garments'),
('6110', 'Jerseys, pullovers, cardigans, waistcoats and similar articles, knitted', 'GST_12', 'Chapter 61 - Knitted Garments'),
('6111', 'Babies garments and clothing accessories, knitted or crocheted', 'GST_5', 'Chapter 61 - Knitted Garments'),
('6112', 'Track suits, ski suits and swimwear, knitted or crocheted', 'GST_12', 'Chapter 61 - Knitted Garments'),
('6115', 'Pantyhose, tights, stockings, socks and other hosiery, knitted', 'GST_5', 'Chapter 61 - Knitted Garments'),
('6116', 'Gloves, mittens and mitts, knitted or crocheted', 'GST_12', 'Chapter 61 - Knitted Garments'),
('6117', 'Other made up clothing accessories, knitted or crocheted', 'GST_12', 'Chapter 61 - Knitted Garments'),

-- Chapter 62: Articles of Apparel, Not Knitted
('6201', 'Mens or boys overcoats, car-coats, capes, cloaks and similar articles, woven', 'GST_12', 'Chapter 62 - Woven Garments'),
('6202', 'Womens or girls overcoats, car-coats, capes, cloaks and similar articles, woven', 'GST_12', 'Chapter 62 - Woven Garments'),
('6203', 'Mens or boys suits, ensembles, jackets, blazers, trousers, shorts, woven', 'GST_12', 'Chapter 62 - Woven Garments'),
('6204', 'Womens or girls suits, ensembles, jackets, dresses, skirts, trousers, woven', 'GST_12', 'Chapter 62 - Woven Garments'),
('6205', 'Mens or boys shirts, woven', 'GST_5', 'Chapter 62 - Woven Garments'),
('6206', 'Womens or girls blouses, shirts and shirt-blouses, woven', 'GST_5', 'Chapter 62 - Woven Garments'),
('6207', 'Mens or boys singlets, underpants, briefs, nightshirts, pyjamas, robes, woven', 'GST_5', 'Chapter 62 - Woven Garments'),
('6208', 'Womens or girls singlets, slips, petticoats, briefs, nightdresses, pyjamas, woven', 'GST_5', 'Chapter 62 - Woven Garments'),
('6211', 'Track suits, ski suits and swimwear, other garments, woven', 'GST_12', 'Chapter 62 - Woven Garments'),
('6212', 'Brassieres, girdles, corsets, braces, suspenders, garters, woven', 'GST_12', 'Chapter 62 - Woven Garments'),
('6214', 'Shawls, scarves, mufflers, mantillas, veils and the like, woven', 'GST_12', 'Chapter 62 - Woven Garments'),
('6215', 'Ties, bow ties and cravats, woven', 'GST_12', 'Chapter 62 - Woven Garments'),
('6217', 'Other made up clothing accessories, parts of garments, woven', 'GST_12', 'Chapter 62 - Woven Garments'),

-- Chapter 63: Other Made Up Textile Articles
('6301', 'Blankets and travelling rugs', 'GST_12', 'Chapter 63 - Home Textiles'),
('6302', 'Bed linen, table linen, toilet linen and kitchen linen', 'GST_12', 'Chapter 63 - Home Textiles'),
('6303', 'Curtains, interior blinds, curtain or bed valances of textile', 'GST_12', 'Chapter 63 - Home Textiles'),
('6304', 'Other furnishing articles excluding those of heading 9404', 'GST_12', 'Chapter 63 - Home Textiles'),
('6305', 'Sacks and bags, of a kind used for the packing of goods', 'GST_5', 'Chapter 63 - Home Textiles'),

-- Chapter 64: Footwear
('6401', 'Waterproof footwear with outer soles and uppers of rubber or plastics', 'GST_18', 'Chapter 64 - Footwear'),
('6402', 'Other footwear with outer soles and uppers of rubber or plastics', 'GST_18', 'Chapter 64 - Footwear'),
('6403', 'Footwear with outer soles of rubber, plastics, leather and uppers of leather', 'GST_18', 'Chapter 64 - Footwear'),
('6404', 'Footwear with outer soles of rubber, plastics, leather and uppers of textile', 'GST_18', 'Chapter 64 - Footwear'),
('6405', 'Other footwear', 'GST_18', 'Chapter 64 - Footwear'),

-- Chapter 69: Ceramic Products
('6911', 'Tableware, kitchenware, other household and toilet articles of porcelain or china', 'GST_12', 'Chapter 69 - Ceramic Products'),
('6912', 'Ceramic tableware, kitchenware, other household and toilet articles, non-porcelain', 'GST_12', 'Chapter 69 - Ceramic Products'),
('6913', 'Statuettes and other ornamental ceramic articles', 'GST_12', 'Chapter 69 - Ceramic Products'),
('6914', 'Other ceramic articles', 'GST_18', 'Chapter 69 - Ceramic Products'),

-- Chapter 71: Natural or Cultured Pearls, Precious Stones, Jewellery
('7113', 'Articles of jewellery and parts thereof, of precious metal', 'GST_5', 'Chapter 71 - Jewellery'),
('7117', 'Imitation jewellery', 'GST_12', 'Chapter 71 - Jewellery'),

-- Chapter 73: Articles of Iron or Steel
('7310', 'Tanks, casks, drums, cans, boxes and similar containers of iron or steel', 'GST_18', 'Chapter 73 - Articles of Iron or Steel'),
('7315', 'Chain and parts thereof, of iron or steel', 'GST_18', 'Chapter 73 - Articles of Iron or Steel'),
('7318', 'Screws, bolts, nuts, coach screws, hooks, rivets, keys, washers of iron or steel', 'GST_18', 'Chapter 73 - Articles of Iron or Steel'),
('7321', 'Stoves, ranges, grates, cookers, barbecues, braziers, gas-rings of iron or steel', 'GST_18', 'Chapter 73 - Articles of Iron or Steel'),
('7323', 'Table, kitchen or other household articles and parts thereof, of iron or steel', 'GST_18', 'Chapter 73 - Articles of Iron or Steel'),
('7324', 'Sanitary ware and parts thereof, of iron or steel', 'GST_18', 'Chapter 73 - Articles of Iron or Steel'),
('7325', 'Other cast articles of iron or steel', 'GST_18', 'Chapter 73 - Articles of Iron or Steel'),
('7326', 'Other articles of iron or steel', 'GST_18', 'Chapter 73 - Articles of Iron or Steel'),

-- Chapter 76: Aluminium and Articles Thereof
('7612', 'Aluminium casks, drums, cans, boxes and similar containers', 'GST_18', 'Chapter 76 - Aluminium and Articles Thereof'),
('7615', 'Table, kitchen or other household articles and parts thereof, of aluminium', 'GST_18', 'Chapter 76 - Aluminium and Articles Thereof'),
('7616', 'Other articles of aluminium', 'GST_18', 'Chapter 76 - Aluminium and Articles Thereof'),

-- Chapter 83: Miscellaneous Articles of Base Metal
('8302', 'Base metal mountings, fittings and similar articles for furniture, doors, staircases', 'GST_18', 'Chapter 83 - Miscellaneous Articles of Base Metal'),
('8304', 'Filing cabinets, card-index cabinets, desk trays, paper rests and similar office articles of base metal', 'GST_18', 'Chapter 83 - Miscellaneous Articles of Base Metal'),
('8306', 'Bells, gongs and the like, non-electric, of base metal; statuettes and ornaments of base metal', 'GST_18', 'Chapter 83 - Miscellaneous Articles of Base Metal'),

-- Chapter 84: Nuclear Reactors, Boilers, Machinery
('8414', 'Air or vacuum pumps, air or other gas compressors and fans', 'GST_18', 'Chapter 84 - Machinery and Mechanical Appliances'),
('8415', 'Air conditioning machines with motor-driven fan and elements for changing temperature', 'GST_28', 'Chapter 84 - Machinery and Mechanical Appliances'),
('8418', 'Refrigerators, freezers and other refrigerating or freezing equipment', 'GST_18', 'Chapter 84 - Machinery and Mechanical Appliances'),
('8443', 'Printing machinery; printers, copying machines and facsimile machines', 'GST_18', 'Chapter 84 - Machinery and Mechanical Appliances'),
('8450', 'Household or laundry-type washing machines', 'GST_18', 'Chapter 84 - Machinery and Mechanical Appliances'),
('8467', 'Tools for working in the hand, pneumatic, hydraulic or with self-contained motor', 'GST_18', 'Chapter 84 - Machinery and Mechanical Appliances'),
('8471', 'Automatic data processing machines (computers) and units thereof', 'GST_18', 'Chapter 84 - Machinery and Mechanical Appliances'),

-- Chapter 85: Electrical Machinery and Equipment
('8504', 'Electrical transformers, static converters (for example rectifiers) and inductors', 'GST_18', 'Chapter 85 - Electrical Machinery and Equipment'),
('8507', 'Electric accumulators including separators therefor', 'GST_28', 'Chapter 85 - Electrical Machinery and Equipment'),
('8516', 'Electric water heaters, hair dryers, irons, toasters, coffee makers, room heaters', 'GST_18', 'Chapter 85 - Electrical Machinery and Equipment'),
('8517', 'Telephone sets, including smartphones; other apparatus for transmission of voice, data', 'GST_18', 'Chapter 85 - Electrical Machinery and Equipment'),
('8518', 'Microphones, loudspeakers, headphones, earphones, amplifiers and sound amplifier sets', 'GST_18', 'Chapter 85 - Electrical Machinery and Equipment'),
('8523', 'Discs, tapes, solid-state storage devices, smart cards and other media for recording', 'GST_18', 'Chapter 85 - Electrical Machinery and Equipment'),
('8528', 'Monitors and projectors; television receivers, whether or not incorporating radio-broadcast', 'GST_28', 'Chapter 85 - Electrical Machinery and Equipment'),
('8536', 'Electrical apparatus for switching or protecting circuits, for voltage not exceeding 1000V', 'GST_18', 'Chapter 85 - Electrical Machinery and Equipment'),
('8539', 'Electric filament or discharge lamps, including sealed beam lamp units, LED lamps', 'GST_18', 'Chapter 85 - Electrical Machinery and Equipment'),
('8544', 'Insulated wire, cable and other insulated electric conductors; optical fibre cables', 'GST_18', 'Chapter 85 - Electrical Machinery and Equipment'),

-- Chapter 94: Furniture, Bedding, Mattresses
('9401', 'Seats (other than those of heading 9402), whether or not convertible into beds', 'GST_18', 'Chapter 94 - Furniture'),
('9403', 'Other furniture and parts thereof', 'GST_18', 'Chapter 94 - Furniture'),
('9404', 'Mattress supports; mattresses, quilts, cushions, pillows, sleeping bags', 'GST_18', 'Chapter 94 - Furniture'),
('9405', 'Lamps and lighting fittings, illuminated signs, illuminated name-plates', 'GST_18', 'Chapter 94 - Furniture'),

-- Chapter 95: Toys, Games and Sports
('9503', 'Tricycles, scooters, pedal cars and similar wheeled toys; dolls; puzzles; toy models', 'GST_12', 'Chapter 95 - Toys, Games and Sports Requisites'),
('9504', 'Video game consoles, articles for arcade and table or parlour games', 'GST_28', 'Chapter 95 - Toys, Games and Sports Requisites'),
('9505', 'Festive, carnival or other entertainment articles, including magic tricks', 'GST_12', 'Chapter 95 - Toys, Games and Sports Requisites'),
('9506', 'Articles and equipment for general physical exercise, gymnastics, athletics, sports', 'GST_18', 'Chapter 95 - Toys, Games and Sports Requisites'),

-- Chapter 96: Miscellaneous Manufactured Articles
('9603', 'Brooms, brushes, hand-operated mechanical floor sweepers, mops, feather dusters', 'GST_18', 'Chapter 96 - Miscellaneous Manufactured Articles'),
('9608', 'Ball point pens; felt tipped markers and pens; fountain pens, stylograph pens', 'GST_18', 'Chapter 96 - Miscellaneous Manufactured Articles'),
('9609', 'Pencils, crayons, pencil leads, pastels, drawing charcoals, writing or drawing chalks', 'GST_12', 'Chapter 96 - Miscellaneous Manufactured Articles'),
('9611', 'Date, sealing or numbering stamps, devices for printing or embossing labels, typing ribbons', 'GST_18', 'Chapter 96 - Miscellaneous Manufactured Articles');

-- --------------------------------------------------------------------------
-- 5.4 Default Categories (for default tenant)
-- --------------------------------------------------------------------------

-- Fashion attributes schema
-- Used for Fashion > Men and Fashion > Women sub-categories
-- (declared here as a comment for reference; applied inline below)

-- ── ROOT: Fashion ──
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'Fashion', NULL, '6109', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Sleeve","type":"select","options":["Full Sleeve","Half Sleeve","Sleeveless","3/4 Sleeve"],"required":false}
    ]'::jsonb, 1);

-- Fashion > Men
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
    'Men', '10000000-0000-0000-0000-000000000001', '6205', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Sleeve","type":"select","options":["Full Sleeve","Half Sleeve","Sleeveless","3/4 Sleeve"],"required":false}
    ]'::jsonb, 1);

-- Fashion > Men > Shirts
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
    'Shirts', '10000000-0000-0000-0000-000000000010', '6205', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Sleeve","type":"select","options":["Full Sleeve","Half Sleeve","Sleeveless","3/4 Sleeve"],"required":false},
        {"name":"Fit","type":"select","options":["Regular","Slim","Relaxed"],"required":false},
        {"name":"Collar","type":"select","options":["Spread","Button-Down","Mandarin","Band"],"required":false}
    ]'::jsonb, 1);

-- Fashion > Men > T-Shirts
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
    'T-Shirts', '10000000-0000-0000-0000-000000000010', '6109', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Sleeve","type":"select","options":["Full Sleeve","Half Sleeve","Sleeveless","3/4 Sleeve"],"required":false},
        {"name":"Neck","type":"select","options":["Round Neck","V-Neck","Polo","Henley"],"required":false}
    ]'::jsonb, 2);

-- Fashion > Men > Kurtas
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001',
    'Kurtas', '10000000-0000-0000-0000-000000000010', '6109', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Sleeve","type":"select","options":["Full Sleeve","Half Sleeve","Sleeveless","3/4 Sleeve"],"required":false},
        {"name":"Length","type":"select","options":["Short","Medium","Long"],"required":false}
    ]'::jsonb, 3);

-- Fashion > Men > Trousers
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001',
    'Trousers', '10000000-0000-0000-0000-000000000010', '6203', 'GST_12',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["28","30","32","34","36","38","40","42"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Fit","type":"select","options":["Regular","Slim","Relaxed","Straight"],"required":false}
    ]'::jsonb, 4);

-- Fashion > Men > Jeans
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001',
    'Jeans', '10000000-0000-0000-0000-000000000010', '6203', 'GST_12',
    '[
        {"name":"Color","type":"select","options":["Blue","Black","Grey","Dark Blue","Light Blue","White"],"required":true},
        {"name":"Size","type":"multi-select","options":["28","30","32","34","36","38","40","42"],"required":true},
        {"name":"Material","type":"select","options":["Denim","Stretch Denim"],"required":false},
        {"name":"Fit","type":"select","options":["Skinny","Slim","Regular","Relaxed","Bootcut"],"required":false}
    ]'::jsonb, 5);

-- Fashion > Women
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001',
    'Women', '10000000-0000-0000-0000-000000000001', '6206', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Sleeve","type":"select","options":["Full Sleeve","Half Sleeve","Sleeveless","3/4 Sleeve"],"required":false}
    ]'::jsonb, 2);

-- Fashion > Women > Sarees
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001',
    'Sarees', '10000000-0000-0000-0000-000000000020', '5208', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige","Gold"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Silk","Chiffon","Georgette","Crepe","Net","Linen","Banarasi","Kanjivaram","Chanderi"],"required":true},
        {"name":"Length","type":"select","options":["5.5 Meters","6 Meters","9 Meters"],"required":false},
        {"name":"Occasion","type":"select","options":["Casual","Festive","Party","Wedding","Office"],"required":false}
    ]'::jsonb, 1);

-- Fashion > Women > Kurtas
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001',
    'Kurtas', '10000000-0000-0000-0000-000000000020', '6109', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Sleeve","type":"select","options":["Full Sleeve","Half Sleeve","Sleeveless","3/4 Sleeve"],"required":false},
        {"name":"Length","type":"select","options":["Short","Medium","Long","Ankle Length"],"required":false}
    ]'::jsonb, 2);

-- Fashion > Women > Dresses
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001',
    'Dresses', '10000000-0000-0000-0000-000000000020', '6204', 'GST_12',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon","Georgette"],"required":false},
        {"name":"Occasion","type":"select","options":["Casual","Party","Formal","Beach","Festive"],"required":false}
    ]'::jsonb, 3);

-- Fashion > Women > Tops
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001',
    'Tops', '10000000-0000-0000-0000-000000000020', '6106', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim","Leather","Nylon","Chiffon"],"required":false},
        {"name":"Sleeve","type":"select","options":["Full Sleeve","Half Sleeve","Sleeveless","3/4 Sleeve","Cap Sleeve"],"required":false}
    ]'::jsonb, 4);

-- Fashion > Women > Leggings
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001',
    'Leggings', '10000000-0000-0000-0000-000000000020', '6104', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["XS","S","M","L","XL","XXL","XXXL"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Lycra","Spandex","Polyester"],"required":false}
    ]'::jsonb, 5);

-- Fashion > Kids
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001',
    'Kids', '10000000-0000-0000-0000-000000000001', '6111', 'GST_5',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige"],"required":true},
        {"name":"Size","type":"multi-select","options":["0-6M","6-12M","1-2Y","2-4Y","4-6Y","6-8Y","8-10Y","10-12Y","12-14Y"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Polyester","Silk","Wool","Linen","Rayon","Denim"],"required":false},
        {"name":"Gender","type":"select","options":["Boys","Girls","Unisex"],"required":true}
    ]'::jsonb, 3);

-- Fashion > Accessories
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001',
    'Accessories', '10000000-0000-0000-0000-000000000001', '6217', 'GST_12',
    '[
        {"name":"Color","type":"select","options":["Red","Blue","Green","Black","White","Yellow","Pink","Orange","Purple","Brown","Grey","Navy","Maroon","Beige","Gold","Silver"],"required":true},
        {"name":"Material","type":"select","options":["Cotton","Leather","Metal","Plastic","Fabric","Wood","Glass"],"required":false},
        {"name":"Type","type":"select","options":["Belt","Scarf","Hat","Cap","Wallet","Watch","Sunglasses","Tie","Handbag"],"required":false}
    ]'::jsonb, 4);

-- ── ROOT: Electronics ──
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
    'Electronics', NULL, '8517', 'GST_18',
    '[
        {"name":"Brand","type":"text","required":true},
        {"name":"Warranty","type":"select","options":["No Warranty","6 Months","1 Year","2 Years","3 Years","5 Years"],"required":true},
        {"name":"Power","type":"text","required":false},
        {"name":"Voltage","type":"select","options":["110V","220V","Dual Voltage","Battery Powered","USB Powered"],"required":false}
    ]'::jsonb, 2);

-- Electronics > Mobiles
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001',
    'Mobiles', '10000000-0000-0000-0000-000000000002', '8517', 'GST_18',
    '[
        {"name":"Brand","type":"text","required":true},
        {"name":"Warranty","type":"select","options":["No Warranty","6 Months","1 Year","2 Years"],"required":true},
        {"name":"RAM","type":"select","options":["2GB","3GB","4GB","6GB","8GB","12GB","16GB"],"required":false},
        {"name":"Storage","type":"select","options":["16GB","32GB","64GB","128GB","256GB","512GB","1TB"],"required":false},
        {"name":"Screen Size","type":"text","required":false}
    ]'::jsonb, 1);

-- Electronics > Accessories
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001',
    'Electronics Accessories', '10000000-0000-0000-0000-000000000002', '8544', 'GST_18',
    '[
        {"name":"Brand","type":"text","required":true},
        {"name":"Warranty","type":"select","options":["No Warranty","6 Months","1 Year","2 Years"],"required":true},
        {"name":"Compatibility","type":"text","required":false}
    ]'::jsonb, 2);

-- Electronics > Laptops
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001',
    'Laptops', '10000000-0000-0000-0000-000000000002', '8471', 'GST_18',
    '[
        {"name":"Brand","type":"text","required":true},
        {"name":"Warranty","type":"select","options":["1 Year","2 Years","3 Years"],"required":true},
        {"name":"RAM","type":"select","options":["4GB","8GB","16GB","32GB","64GB"],"required":false},
        {"name":"Storage","type":"select","options":["256GB SSD","512GB SSD","1TB SSD","1TB HDD","2TB HDD"],"required":false},
        {"name":"Processor","type":"text","required":false},
        {"name":"Screen Size","type":"text","required":false}
    ]'::jsonb, 3);

-- Electronics > Audio
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000001',
    'Audio', '10000000-0000-0000-0000-000000000002', '8518', 'GST_18',
    '[
        {"name":"Brand","type":"text","required":true},
        {"name":"Warranty","type":"select","options":["No Warranty","6 Months","1 Year","2 Years"],"required":true},
        {"name":"Connectivity","type":"select","options":["Wired","Bluetooth","WiFi","3.5mm Jack","USB"],"required":false},
        {"name":"Type","type":"select","options":["Over-Ear","In-Ear","On-Ear","Speaker","Soundbar"],"required":false}
    ]'::jsonb, 4);

-- Electronics > Cameras
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000001',
    'Cameras', '10000000-0000-0000-0000-000000000002', '8525', 'GST_18',
    '[
        {"name":"Brand","type":"text","required":true},
        {"name":"Warranty","type":"select","options":["1 Year","2 Years","3 Years"],"required":true},
        {"name":"Resolution","type":"text","required":false},
        {"name":"Type","type":"select","options":["DSLR","Mirrorless","Point & Shoot","Action Camera","Webcam"],"required":false}
    ]'::jsonb, 5);

-- ── ROOT: Home & Kitchen ──
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
    'Home & Kitchen', NULL, '7323', 'GST_18',
    '[
        {"name":"Material","type":"select","options":["Stainless Steel","Aluminium","Copper","Iron","Ceramic","Glass","Wood","Plastic","Bamboo","Silicone"],"required":true},
        {"name":"Capacity","type":"text","required":false},
        {"name":"Dishwasher Safe","type":"boolean","required":false}
    ]'::jsonb, 3);

-- Home & Kitchen > Cookware
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000001',
    'Cookware', '10000000-0000-0000-0000-000000000003', '7323', 'GST_18',
    '[
        {"name":"Material","type":"select","options":["Stainless Steel","Aluminium","Copper","Iron","Cast Iron","Non-Stick","Ceramic Coated"],"required":true},
        {"name":"Capacity","type":"text","required":false},
        {"name":"Induction Compatible","type":"boolean","required":false},
        {"name":"Dishwasher Safe","type":"boolean","required":false}
    ]'::jsonb, 1);

-- Home & Kitchen > Tableware
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000001',
    'Tableware', '10000000-0000-0000-0000-000000000003', '6912', 'GST_12',
    '[
        {"name":"Material","type":"select","options":["Ceramic","Porcelain","Glass","Stainless Steel","Melamine","Bone China","Terracotta","Wood"],"required":true},
        {"name":"Capacity","type":"text","required":false},
        {"name":"Microwave Safe","type":"boolean","required":false},
        {"name":"Dishwasher Safe","type":"boolean","required":false}
    ]'::jsonb, 2);

-- Home & Kitchen > Decor
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000001',
    'Decor', '10000000-0000-0000-0000-000000000003', '6913', 'GST_12',
    '[
        {"name":"Material","type":"select","options":["Ceramic","Glass","Wood","Metal","Fabric","Resin","Marble","Paper"],"required":true},
        {"name":"Dimensions","type":"text","required":false},
        {"name":"Style","type":"select","options":["Modern","Traditional","Bohemian","Minimalist","Rustic","Industrial"],"required":false}
    ]'::jsonb, 3);

-- Home & Kitchen > Storage
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000001',
    'Storage', '10000000-0000-0000-0000-000000000003', '3924', 'GST_18',
    '[
        {"name":"Material","type":"select","options":["Plastic","Stainless Steel","Glass","Wood","Fabric","Bamboo","Jute"],"required":true},
        {"name":"Capacity","type":"text","required":false},
        {"name":"Airtight","type":"boolean","required":false}
    ]'::jsonb, 4);

-- Home & Kitchen > Bedding
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000001',
    'Bedding', '10000000-0000-0000-0000-000000000003', '6302', 'GST_12',
    '[
        {"name":"Material","type":"select","options":["Cotton","Silk","Satin","Microfiber","Linen","Polyester","Flannel"],"required":true},
        {"name":"Size","type":"select","options":["Single","Double","Queen","King","Super King"],"required":true},
        {"name":"Thread Count","type":"text","required":false}
    ]'::jsonb, 5);

-- ── ROOT: Beauty & Personal Care ──
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
    'Beauty & Personal Care', NULL, '3304', 'GST_28',
    '[
        {"name":"Skin Type","type":"select","options":["All Skin Types","Oily","Dry","Combination","Sensitive","Normal"],"required":false},
        {"name":"Volume/Weight","type":"text","required":false},
        {"name":"Organic","type":"boolean","required":false}
    ]'::jsonb, 4);

-- Beauty > Skincare
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000001',
    'Skincare', '10000000-0000-0000-0000-000000000004', '3304', 'GST_28',
    '[
        {"name":"Skin Type","type":"select","options":["All Skin Types","Oily","Dry","Combination","Sensitive","Normal"],"required":false},
        {"name":"Volume","type":"text","required":true},
        {"name":"SPF","type":"text","required":false},
        {"name":"Organic","type":"boolean","required":false}
    ]'::jsonb, 1);

-- Beauty > Haircare
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000001',
    'Haircare', '10000000-0000-0000-0000-000000000004', '3305', 'GST_18',
    '[
        {"name":"Hair Type","type":"select","options":["All Hair Types","Oily","Dry","Normal","Curly","Straight","Color Treated"],"required":false},
        {"name":"Volume","type":"text","required":true},
        {"name":"Organic","type":"boolean","required":false}
    ]'::jsonb, 2);

-- Beauty > Makeup
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000001',
    'Makeup', '10000000-0000-0000-0000-000000000004', '3304', 'GST_28',
    '[
        {"name":"Shade","type":"text","required":false},
        {"name":"Finish","type":"select","options":["Matte","Glossy","Satin","Shimmer","Natural"],"required":false},
        {"name":"Volume/Weight","type":"text","required":false},
        {"name":"Organic","type":"boolean","required":false}
    ]'::jsonb, 3);

-- Beauty > Fragrance
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000001',
    'Fragrance', '10000000-0000-0000-0000-000000000004', '3303', 'GST_28',
    '[
        {"name":"Volume","type":"text","required":true},
        {"name":"Type","type":"select","options":["Eau de Parfum","Eau de Toilette","Cologne","Body Mist","Attar"],"required":false},
        {"name":"Gender","type":"select","options":["Men","Women","Unisex"],"required":false}
    ]'::jsonb, 4);

-- ── ROOT: Food & Beverages ──
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
    'Food & Beverages', NULL, '2106', 'GST_5',
    '[
        {"name":"Shelf Life","type":"text","required":true},
        {"name":"Weight","type":"text","required":true},
        {"name":"Vegetarian","type":"boolean","required":true},
        {"name":"Organic","type":"boolean","required":false}
    ]'::jsonb, 5);

-- Food > Snacks
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000001',
    'Snacks', '10000000-0000-0000-0000-000000000005', '1905', 'GST_12',
    '[
        {"name":"Shelf Life","type":"text","required":true},
        {"name":"Weight","type":"text","required":true},
        {"name":"Vegetarian","type":"boolean","required":true},
        {"name":"Flavour","type":"text","required":false}
    ]'::jsonb, 1);

-- Food > Spices
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000001',
    'Spices', '10000000-0000-0000-0000-000000000005', '0910', 'GST_5',
    '[
        {"name":"Shelf Life","type":"text","required":true},
        {"name":"Weight","type":"text","required":true},
        {"name":"Vegetarian","type":"boolean","required":true},
        {"name":"Organic","type":"boolean","required":false},
        {"name":"Form","type":"select","options":["Whole","Ground","Paste","Blend"],"required":false}
    ]'::jsonb, 2);

-- Food > Beverages
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000001',
    'Beverages', '10000000-0000-0000-0000-000000000005', '2101', 'GST_18',
    '[
        {"name":"Shelf Life","type":"text","required":true},
        {"name":"Volume","type":"text","required":true},
        {"name":"Vegetarian","type":"boolean","required":true},
        {"name":"Caffeine","type":"boolean","required":false}
    ]'::jsonb, 3);

-- Food > Dry Fruits
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000001',
    'Dry Fruits', '10000000-0000-0000-0000-000000000005', '0802', 'GST_5',
    '[
        {"name":"Shelf Life","type":"text","required":true},
        {"name":"Weight","type":"text","required":true},
        {"name":"Vegetarian","type":"boolean","required":true},
        {"name":"Organic","type":"boolean","required":false}
    ]'::jsonb, 4);

-- Food > Sweets
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000085', '00000000-0000-0000-0000-000000000001',
    'Sweets', '10000000-0000-0000-0000-000000000005', '1704', 'GST_18',
    '[
        {"name":"Shelf Life","type":"text","required":true},
        {"name":"Weight","type":"text","required":true},
        {"name":"Vegetarian","type":"boolean","required":true},
        {"name":"Contains Nuts","type":"boolean","required":false}
    ]'::jsonb, 5);

-- ── ROOT: Handicrafts ──
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
    'Handicrafts', NULL, '4420', 'GST_12',
    '[
        {"name":"Material","type":"select","options":["Wood","Metal","Clay","Terracotta","Jute","Bamboo","Stone","Glass","Paper Mache","Brass","Copper"],"required":true},
        {"name":"Origin","type":"text","required":false},
        {"name":"Handmade","type":"boolean","required":true},
        {"name":"Dimensions","type":"text","required":false}
    ]'::jsonb, 6);

-- Handicrafts > Pottery
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000001',
    'Pottery', '10000000-0000-0000-0000-000000000006', '6912', 'GST_12',
    '[
        {"name":"Material","type":"select","options":["Terracotta","Ceramic","Stoneware","Porcelain","Earthenware"],"required":true},
        {"name":"Finish","type":"select","options":["Glazed","Unglazed","Painted","Natural"],"required":false},
        {"name":"Handmade","type":"boolean","required":true},
        {"name":"Dimensions","type":"text","required":false}
    ]'::jsonb, 1);

-- Handicrafts > Textiles
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000001',
    'Textiles', '10000000-0000-0000-0000-000000000006', '5208', 'GST_5',
    '[
        {"name":"Material","type":"select","options":["Cotton","Silk","Jute","Wool","Linen","Khadi"],"required":true},
        {"name":"Technique","type":"select","options":["Block Print","Screen Print","Hand Embroidery","Machine Embroidery","Tie & Dye","Batik","Kalamkari","Ikat"],"required":false},
        {"name":"Handmade","type":"boolean","required":true},
        {"name":"Dimensions","type":"text","required":false}
    ]'::jsonb, 2);

-- Handicrafts > Woodwork
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000093', '00000000-0000-0000-0000-000000000001',
    'Woodwork', '10000000-0000-0000-0000-000000000006', '4420', 'GST_12',
    '[
        {"name":"Wood Type","type":"select","options":["Sheesham","Teak","Mango","Sandalwood","Walnut","Pine","Bamboo","Rosewood"],"required":true},
        {"name":"Finish","type":"select","options":["Polished","Lacquered","Painted","Natural","Oil Finished"],"required":false},
        {"name":"Handmade","type":"boolean","required":true},
        {"name":"Dimensions","type":"text","required":false}
    ]'::jsonb, 3);

-- Handicrafts > Metalwork
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000094', '00000000-0000-0000-0000-000000000001',
    'Metalwork', '10000000-0000-0000-0000-000000000006', '8306', 'GST_18',
    '[
        {"name":"Metal","type":"select","options":["Brass","Copper","Bronze","Iron","Aluminium","Bell Metal","Silver"],"required":true},
        {"name":"Technique","type":"select","options":["Cast","Hammered","Engraved","Filigree","Inlay","Enamelled"],"required":false},
        {"name":"Handmade","type":"boolean","required":true},
        {"name":"Dimensions","type":"text","required":false}
    ]'::jsonb, 4);

-- Handicrafts > Paintings
INSERT INTO category (id, tenant_id, name, parent_id, hsn_code_default, default_gst_rate, attributes_schema, sort_order)
VALUES ('10000000-0000-0000-0000-000000000095', '00000000-0000-0000-0000-000000000001',
    'Paintings', '10000000-0000-0000-0000-000000000006', '9701', 'GST_12',
    '[
        {"name":"Medium","type":"select","options":["Oil","Acrylic","Watercolor","Charcoal","Pencil","Digital Print","Mixed Media"],"required":true},
        {"name":"Style","type":"select","options":["Madhubani","Warli","Pattachitra","Miniature","Tanjore","Kalighat","Gond","Phad","Contemporary","Abstract"],"required":false},
        {"name":"Dimensions","type":"text","required":true},
        {"name":"Framed","type":"boolean","required":true}
    ]'::jsonb, 5);

-- --------------------------------------------------------------------------
-- 5.5 Sample Products
-- --------------------------------------------------------------------------

-- Product 1: Cotton Kurta - Blue Handloom
INSERT INTO product (
    id, tenant_id, category_id, name, slug, short_description, long_description,
    brand, manufacturer, hsn_code, gst_rate, sku, barcode_type, barcode_value,
    mrp, selling_price, cost_price, unit, weight_grams,
    length_cm, width_cm, height_cm,
    track_inventory, current_stock, low_stock_threshold,
    custom_attributes, tags,
    seo_title, seo_description, seo_keywords,
    status, is_featured, created_by
)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000013',   -- Fashion > Men > Kurtas
    'Cotton Kurta - Blue Handloom',
    'cotton-kurta-blue-handloom',
    'Premium handloom cotton kurta in indigo blue, perfect for festive and casual occasions.',
    'This exquisite handloom cotton kurta is crafted by skilled artisans from Andhra Pradesh using traditional weaving techniques. Made from 100% organic cotton, the fabric is breathable and comfortable for all-day wear. The rich indigo blue color is achieved through natural dyeing processes, making it eco-friendly. Features include a mandarin collar, front button placket, and side slits for ease of movement. The kurta is pre-washed to prevent shrinkage and maintains its color even after multiple washes. Pair it with white churidars or denims for a contemporary ethnic look.',
    'Nandi Crafts',
    'Nandi Handloom Weavers Cooperative',
    '6109',
    'GST_5',
    'KRT-BLU-001',
    'EAN13',
    '8901234567890',
    1499.00,
    999.00,
    400.00,
    'PCS',
    250.00,
    75.00,
    50.00,
    3.00,
    TRUE,
    45.00,
    10,
    '{"Color": "Blue", "Size": ["M", "L", "XL", "XXL"], "Material": "Cotton", "Sleeve": "Full Sleeve", "Length": "Long"}'::jsonb,
    ARRAY['cotton', 'kurta', 'handloom', 'ethnic', 'men'],
    'Buy Cotton Kurta Blue Handloom Online | Nandi Crafts',
    'Shop premium handloom cotton kurta in indigo blue. 100% organic cotton, natural dyes, artisan made. Perfect for festive and casual wear. Free shipping above Rs 500.',
    ARRAY['cotton kurta', 'handloom kurta', 'blue kurta', 'ethnic wear men', 'indian kurta online', 'organic cotton kurta'],
    'ACTIVE',
    TRUE,
    '00000000-0000-0000-0000-000000000002'
);

-- Product 2: Handmade Ceramic Mug - Terracotta
INSERT INTO product (
    id, tenant_id, category_id, name, slug, short_description, long_description,
    brand, manufacturer, hsn_code, gst_rate, sku, barcode_type, barcode_value,
    mrp, selling_price, cost_price, unit, weight_grams,
    length_cm, width_cm, height_cm,
    track_inventory, current_stock, low_stock_threshold,
    custom_attributes, tags,
    seo_title, seo_description, seo_keywords,
    status, is_featured, created_by
)
VALUES (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000062',   -- Home & Kitchen > Tableware
    'Handmade Ceramic Mug - Terracotta',
    'handmade-ceramic-mug-terracotta',
    'Artisan terracotta ceramic mug with a rustic finish, ideal for tea and coffee lovers.',
    'Elevate your morning ritual with this beautifully handcrafted ceramic mug from the potters of Khurja, Uttar Pradesh. Each mug is individually wheel-thrown and hand-glazed, ensuring that no two pieces are exactly alike. The warm terracotta base is complemented by a natural brown glaze that gives it a rustic, earthy aesthetic. The mug holds approximately 300ml and features a comfortable curved handle designed for a secure grip. It is lead-free, food-safe, and microwave-safe. The sturdy construction makes it suitable for everyday use while the artisan quality makes it an ideal gift. Wash with mild soap and water; dishwasher safe on the top rack.',
    'Nandi Crafts',
    'Khurja Pottery Artisans',
    '6912',
    'GST_12',
    'MUG-TRC-001',
    'CUSTOM',
    'NC-MUG-001',
    599.00,
    449.00,
    150.00,
    'PCS',
    350.00,
    12.00,
    9.00,
    10.00,
    TRUE,
    120.00,
    20,
    '{"Material": "Ceramic", "Capacity": "300ml", "Microwave Safe": true, "Dishwasher Safe": true}'::jsonb,
    ARRAY['ceramic', 'mug', 'handmade', 'pottery', 'terracotta'],
    'Handmade Ceramic Mug Terracotta | Artisan Pottery | Nandi Crafts',
    'Buy handmade terracotta ceramic mug online. Artisan crafted in Khurja, food-safe, microwave-safe. Perfect gift for tea and coffee lovers. Shop now at Nandi Crafts.',
    ARRAY['ceramic mug', 'terracotta mug', 'handmade mug', 'pottery mug', 'artisan mug', 'khurja pottery'],
    'ACTIVE',
    FALSE,
    '00000000-0000-0000-0000-000000000002'
);

-- Product 3: Organic Turmeric Powder - 200g
INSERT INTO product (
    id, tenant_id, category_id, name, slug, short_description, long_description,
    brand, manufacturer, hsn_code, gst_rate, sku, barcode_type, barcode_value,
    mrp, selling_price, cost_price, unit, weight_grams,
    length_cm, width_cm, height_cm,
    track_inventory, current_stock, low_stock_threshold,
    custom_attributes, tags,
    seo_title, seo_description, seo_keywords,
    status, is_featured, created_by
)
VALUES (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000082',   -- Food & Beverages > Spices
    'Organic Turmeric Powder - 200g',
    'organic-turmeric-powder-200g',
    'Pure organic turmeric powder sourced from farms in Erode, Tamil Nadu. High curcumin content.',
    'Bring the golden goodness of authentic Indian turmeric to your kitchen with our premium organic turmeric powder. Sourced directly from certified organic farms in Erode, Tamil Nadu - known as the Turmeric Capital of India - this powder boasts a rich golden-yellow color and an intense earthy aroma. Our turmeric is sun-dried and stone-ground using traditional methods to preserve its natural oils and high curcumin content (minimum 3.5%). It is free from artificial colors, preservatives, and additives. FSSAI certified and lab tested for purity. Use it in curries, milk (golden latte), rice dishes, pickles, and traditional remedies. The resealable pouch ensures freshness for up to 12 months from the date of packaging. Each 200g pack is nitrogen-flushed to maintain potency.',
    'Nandi Naturals',
    'Nandi Organic Farms Pvt Ltd',
    '0910',
    'GST_5',
    'TRM-ORG-200',
    'EAN13',
    '8901234567906',
    249.00,
    199.00,
    80.00,
    'GM',
    220.00,
    18.00,
    10.00,
    5.00,
    TRUE,
    200.00,
    30,
    '{"Shelf Life": "12 months", "Weight": "200g", "Vegetarian": true, "Organic": true, "Form": "Ground"}'::jsonb,
    ARRAY['turmeric', 'organic', 'spice', 'haldi', 'cooking'],
    'Organic Turmeric Powder 200g | High Curcumin | Nandi Naturals',
    'Buy pure organic turmeric powder from Erode, Tamil Nadu. High curcumin content, FSSAI certified, no additives. 200g resealable pack. Shop organic spices at Nandi Naturals.',
    ARRAY['organic turmeric', 'turmeric powder', 'haldi powder', 'erode turmeric', 'curcumin', 'organic spices'],
    'DRAFT',
    FALSE,
    '00000000-0000-0000-0000-000000000002'
);

-- ============================================================================
-- 6. PHASE 2 SCHEMA — AI & VARIANTS
-- ============================================================================

-- --------------------------------------------------------------------------
-- 6.1 New enum types
-- --------------------------------------------------------------------------

CREATE TYPE ai_generation_type AS ENUM (
    'DESCRIPTION', 'SEO_TITLE', 'SEO_DESCRIPTION', 'TAGS', 'HSN_SUGGEST'
);

CREATE TYPE ai_provider AS ENUM ('OLLAMA', 'OPENAI');

-- --------------------------------------------------------------------------
-- 6.2 Extend tenant table for AI configuration
-- --------------------------------------------------------------------------

ALTER TABLE tenant ADD COLUMN ai_provider ai_provider DEFAULT 'OLLAMA';
ALTER TABLE tenant ADD COLUMN openai_api_key VARCHAR(255);

-- --------------------------------------------------------------------------
-- 6.3 product_variant
-- --------------------------------------------------------------------------

CREATE TABLE product_variant (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    variant_name    VARCHAR(255) NOT NULL,
    sku             VARCHAR(100),
    barcode_value   VARCHAR(50),
    attributes      JSONB DEFAULT '{}'::jsonb,
    mrp             DECIMAL(12,2),
    selling_price   DECIMAL(12,2),
    cost_price      DECIMAL(12,2),
    current_stock   DECIMAL(12,2) DEFAULT 0,
    weight_grams    DECIMAL(10,2),
    image_id        UUID REFERENCES product_image(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_variant_product_id ON product_variant(product_id);
CREATE INDEX idx_product_variant_sku ON product_variant(sku);

CREATE TRIGGER trg_product_variant_updated_at
    BEFORE UPDATE ON product_variant
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------------------------
-- 6.4 ai_generation_log
-- --------------------------------------------------------------------------

CREATE TABLE ai_generation_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenant(id),
    product_id          UUID REFERENCES product(id) ON DELETE SET NULL,
    generation_type     ai_generation_type NOT NULL,
    input_prompt        TEXT,
    generated_output    TEXT,
    model_used          VARCHAR(100),
    accepted            BOOLEAN DEFAULT FALSE,
    tokens_used         INT,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_generation_log_tenant_id ON ai_generation_log(tenant_id);
CREATE INDEX idx_ai_generation_log_product_id ON ai_generation_log(product_id);

-- ============================================================================
-- END OF INITIALIZATION
-- ============================================================================

COMMIT;
