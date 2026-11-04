/**
 * Starter catalog for DoorKart: sub-categories and about 230 products across stationery, gifts,
 * toys, sports, decoration (welcome, birthday, anniversary, baby shower, wedding and festive) and
 * perfumes under Rs 299. Names, brands, prices and descriptions are typical of Indian marketplace
 * listings but are only a starting point: edit or replace all of it in the admin panel, and check
 * every brand name and price against what you actually stock. Prices are in rupees.
 */

/** A row: [name, brand, MRP, selling price, opening stock, description]. */
export type Row = [name: string, brand: string, mrp: number, price: number, stock: number, description: string];

export type SubCategory = {
  slug: string;
  name: string;
  /** Slug of the top-level category it belongs to. */
  parent: TopSlug;
  /** SKU prefix, e.g. "NB" gives DK-NB-001. */
  code: string;
  description: string;
  rows: Row[];
};

export type TopSlug = 'stationery' | 'gift-items' | 'toys' | 'sports-items' | 'decoration-items' | 'perfumes';

export const TOP_CATEGORIES: { slug: TopSlug; name: string; description: string }[] = [
  { slug: 'stationery', name: 'Stationery', description: 'Notebooks, pens, art supplies and school and office essentials.' },
  { slug: 'gift-items', name: 'Gift Items', description: 'Gifts for birthdays, anniversaries and every occasion.' },
  { slug: 'toys', name: 'Toys', description: 'Toys and games for babies, kids and the whole family.' },
  { slug: 'sports-items', name: 'Sports Items', description: 'Cricket, badminton, football, fitness and indoor games.' },
  { slug: 'decoration-items', name: 'Decoration Items', description: 'Decor for welcome, birthday, anniversary, baby shower and festive events.' },
  { slug: 'perfumes', name: 'Perfumes & Fragrances', description: 'Deodorants, body sprays, perfumes and attars, all under Rs 299.' },
];

export const SUB_CATEGORIES: SubCategory[] = [
  // ======================= STATIONERY =======================
  {
    slug: 'notebooks-diaries', name: 'Notebooks & Diaries', parent: 'stationery', code: 'NB',
    description: 'Ruled and plain notebooks, long books, diaries and journals.',
    rows: [
      ['Classmate Single Line Notebook, 172 Pages (Pack of 6)', 'Classmate', 420, 349, 60, 'Six single-line notebooks of 172 pages with a smooth, bleed-resistant paper that suits school notes.'],
      ['Spiral Notebook A4, 200 Pages, Ruled', 'Navneet', 150, 119, 70, 'A4 spiral-bound notebook with 200 ruled pages; the wire binding lets it open flat.'],
      ['Long Notebook 172 Pages, Pack of 4', 'Camlin', 260, 215, 55, 'Four long notebooks with stitched binding and a sturdy cover for daily school use.'],
      ['Pocket Diary 2027, Hard Cover', 'Archies', 120, 95, 40, 'Compact hard-cover diary with a week-per-view layout, a ribbon bookmark and address pages.'],
      ['A5 Hardbound Journal, Dotted Pages', 'Doodle', 249, 199, 35, 'A5 journal with 160 dotted pages and an elastic closure, handy for planning and bullet journaling.'],
      ['Unruled Drawing Book A4, 40 Pages', 'Navneet', 70, 55, 90, 'Thick white drawing pages that take pencil and crayon well; stapled A4 size.'],
      ['Register Notebook 300 Pages, Hard Bound', 'Sundaram', 180, 149, 30, 'Hard-bound ruled register with 300 pages for accounts, notes and office records.'],
      ['Pocket Notepad with Pen, Pack of 3', 'Cello', 99, 79, 80, 'Three pocket notepads with a small pen each; easy for lists and quick notes.'],
      ['Spiral Index Notebook, 5 Subject', 'Classmate', 199, 169, 45, 'Five-subject spiral notebook with divider tabs and 300 pages to keep all classes in one book.'],
    ],
  },
  {
    slug: 'pens-pencils', name: 'Pens & Pencils', parent: 'stationery', code: 'PN',
    description: 'Ball pens, gel pens, pencils, markers and highlighters.',
    rows: [
      ['Reynolds Trimax Ball Pen, Blue (Pack of 10)', 'Reynolds', 100, 79, 150, 'Ten blue ball pens with a smooth, quick-drying ink flow and a comfortable grip.'],
      ['Cello Butterflow Ball Pen, Blue (Pack of 25)', 'Cello', 250, 199, 100, 'Value pack of 25 blue pens with a light, consistent ink flow for school and office.'],
      ['Pilot V5 Hi-Tecpoint Pen, Black', 'Pilot', 120, 105, 60, 'Liquid-ink pen with a 0.5 mm needle tip for crisp, precise lines.'],
      ['Gel Pen Set, 10 Assorted Colours', 'Camlin', 180, 139, 50, 'Ten gel pens in bright colours with a 0.5 mm tip for notes, journals and art.'],
      ['Apsara Platinum Pencils, Pack of 10', 'Apsara', 70, 59, 140, 'Extra dark HB pencils that sharpen easily and write smoothly without smudging.'],
      ['Doms Zoom Pencil Box (10 Pencils + Eraser + Sharpener)', 'Doms', 90, 72, 100, 'Ready-to-use pencil kit for school: ten pencils, an eraser and a sharpener.'],
      ['Highlighter Set, 6 Pastel Colours', 'Faber-Castell', 220, 179, 45, 'Six pastel highlighters with a chisel tip to mark text without bleeding through the page.'],
      ['Permanent Marker, Black (Pack of 5)', 'Camlin', 120, 95, 60, 'Fast-drying permanent markers with a bullet tip for cartons, labels and craft.'],
      ['Whiteboard Marker, Assorted (Pack of 4)', 'Luxor', 140, 115, 55, 'Four dry-wipe markers in assorted colours that erase cleanly from whiteboards.'],
      ['Fountain Pen with 5 Ink Cartridges', 'Hero', 199, 159, 30, 'Classic fountain pen with a smooth nib and five blue cartridges to start with.'],
    ],
  },
  {
    slug: 'art-craft', name: 'Art & Craft', parent: 'stationery', code: 'AR',
    description: 'Colours, paints, craft paper, glue and DIY craft kits.',
    rows: [
      ['Camel Oil Pastels, 25 Shades', 'Camlin', 120, 99, 80, 'Twenty-five creamy, bright oil pastels in a card box for school art and drawing.'],
      ['Colour Pencils, 24 Shades', 'Faber-Castell', 260, 215, 50, 'Tin of 24 colour pencils with soft, pigmented leads that blend well.'],
      ['Water Colour Cakes, 24 Shades with Brush', 'Camlin', 150, 125, 60, 'Twenty-four water colour cakes with a brush, packed in a sturdy tray.'],
      ['Poster Colour Set, 12 Bottles', 'Doms', 180, 149, 40, 'Twelve opaque poster colours in 15 ml bottles for posters, charts and craft projects.'],
      ['Sketch Pens, 24 Colours', 'Camlin', 180, 145, 70, 'Washable sketch pens with a fine tip for colouring, drawing and school projects.'],
      ['Coloured Chart Paper, Pack of 20 Sheets', 'Generic', 120, 89, 45, 'Twenty assorted colour chart sheets, ideal for school projects and decoration.'],
      ['Fevicol MR Glue, 200 g', 'Pidilite', 80, 72, 60, 'All-purpose white glue for paper, cardboard and light craft work.'],
      ['Glitter Glue Pens, 12 Colours', 'Pidilite', 150, 119, 50, 'Twelve sparkly glue pens for cards, scrapbooks and decorating.'],
      ['Origami Paper, 100 Sheets Assorted Colours', 'Generic', 99, 79, 65, 'One hundred square coloured sheets for folding paper crafts and cards.'],
      ['Clay Modelling Dough, 12 Colours', 'Doms', 130, 105, 55, 'Soft, non-toxic modelling dough in 12 bright colours with moulding tools.'],
    ],
  },
  {
    slug: 'desk-office', name: 'Desk & Office Supplies', parent: 'stationery', code: 'DS',
    description: 'Staplers, files, tape, sticky notes and desk organisers.',
    rows: [
      ['Kangaro Stapler with 1000 Pins', 'Kangaro', 99, 79, 70, 'Compact stapler with a box of 1000 pins; staples up to 25 sheets.'],
      ['Sticky Notes, 5 Colours (500 Sheets)', 'Post-it', 160, 129, 60, 'Five neon and pastel pads that hold firmly and peel off cleanly.'],
      ['Mesh Desk Organiser, 3 Compartments', 'Generic', 299, 249, 25, 'Metal-mesh organiser with three compartments for pens, scissors and small supplies.'],
      ['Transparent Tape, 6 Rolls', 'Generic', 90, 69, 90, 'Six rolls of clear packing and craft tape with strong adhesion.'],
      ['Plastic Document Folders, Pack of 12', 'Solo', 150, 119, 40, 'Twelve clear zip folders to keep documents, bills and school papers safe.'],
      ['Scissors, Stainless Steel 7 inch', 'Kangaro', 80, 65, 60, 'Stainless-steel blades with a comfortable handle for paper and cloth.'],
      ['Paper Clips Box, 200 Pcs', 'Generic', 40, 29, 120, 'Two hundred rust-free paper clips in a handy plastic box.'],
      ['Calculator, 12 Digit Desktop', 'Casio', 399, 349, 25, 'Large-display 12-digit calculator with tax keys, good for shops and offices.'],
      ['A4 Photocopy Paper, 500 Sheets', 'JK', 320, 285, 40, 'A4 70 GSM paper for printers and copiers; bright white and jam-free.'],
    ],
  },
  {
    slug: 'school-supplies', name: 'School Supplies', parent: 'stationery', code: 'SC',
    description: 'Geometry boxes, lunch boxes, water bottles and school bags.',
    rows: [
      ['Geometry Box, 9-Piece Metal Case', 'Camlin', 199, 159, 50, 'Metal case with compass, divider, set squares, protractor, ruler, pencil and eraser.'],
      ['Steel Lunch Box with Bag', 'Milton', 349, 299, 30, 'Insulated steel lunch box that keeps food fresh, with a carry bag.'],
      ['Kids School Water Bottle, 600 ml', 'Cello', 199, 169, 45, 'Leak-proof bottle with a flip lid and carry strap for school.'],
      ['Pencil Pouch with Zip, Printed', 'Generic', 99, 75, 80, 'Zip pencil pouch with a printed pattern; fits pens, pencils and a sharpener.'],
      ['Eraser and Sharpener Combo (Pack of 10)', 'Apsara', 90, 69, 100, 'Ten non-dust erasers and ten sharpeners for classroom or home.'],
      ['Ruler Set, 15 cm, 30 cm Scale', 'Camlin', 60, 49, 85, 'Clear plastic 15 cm and 30 cm rulers with easy-to-read markings.'],
      ['Book Covers, Brown Paper (Pack of 30)', 'Generic', 70, 55, 70, 'Thirty brown paper book covers to protect notebooks through the year.'],
      ['Name Label Stickers, 60 Pcs', 'Generic', 79, 59, 75, 'Sixty write-on labels for notebooks, books and bottles.'],
      ['Backpack for Kids, 15 inch', 'Generic', 799, 599, 15, 'Lightweight school backpack with padded straps and two roomy compartments.'],
    ],
  },

  // ======================= GIFT ITEMS =======================
  {
    slug: 'mugs-bottles', name: 'Mugs & Bottles', parent: 'gift-items', code: 'MG',
    description: 'Printed mugs, magic mugs, flasks and water bottles.',
    rows: [
      ['Printed Ceramic Coffee Mug, 325 ml', 'Generic', 249, 179, 60, 'Glossy ceramic mug with a cheerful print and a comfortable handle.'],
      ['Magic Colour-Changing Mug, Black', 'Generic', 349, 249, 40, 'Black mug that reveals a pattern when hot drinks are poured in.'],
      ['Couple Mug Set of 2, I Love You', 'Generic', 399, 299, 35, 'Two matching ceramic mugs in a gift box, a thoughtful anniversary present.'],
      ['Stainless Steel Flask, 500 ml', 'Milton', 699, 549, 25, 'Double-wall vacuum flask that keeps drinks hot or cold for hours.'],
      ['Sipper Water Bottle with Straw, 750 ml', 'Cello', 349, 279, 40, 'BPA-free bottle with a straw lid and carry loop, good for school or gym.'],
      ['Best Dad Ceramic Mug', 'Generic', 249, 179, 40, 'White mug with a "Best Dad" print, suited to Father\'s Day and birthdays.'],
      ['Best Mom Ceramic Mug', 'Generic', 249, 179, 40, 'White mug with a "Best Mom" print, suited to Mother\'s Day and birthdays.'],
      ['Glass Tumbler Set of 6, 250 ml', 'Treo', 449, 349, 30, 'Clear glass tumblers for water, juice and soft drinks.'],
    ],
  },
  {
    slug: 'photo-frames', name: 'Photo Frames & Showpieces', parent: 'gift-items', code: 'FR',
    description: 'Photo frames, showpieces and table decor gifts.',
    rows: [
      ['Wooden Photo Frame 6x8 inch', 'Generic', 399, 299, 30, 'Classic wooden finish frame with glass front, can stand on a table or hang on a wall.'],
      ['Collage Photo Frame, 5 Photos', 'Generic', 599, 449, 20, 'Wall collage frame holding five photos in different sizes.'],
      ['Table Top Photo Frame 4x6 inch, Pack of 2', 'Generic', 349, 269, 35, 'Two simple tabletop frames for family photos.'],
      ['Love Birds Couple Showpiece', 'Generic', 399, 299, 25, 'Resin showpiece of a couple, a sweet gift for anniversaries and weddings.'],
      ['Laughing Buddha Showpiece, 4 inch', 'Generic', 349, 249, 30, 'Gold-finish Laughing Buddha figure said to bring good luck and cheer.'],
      ['Crystal Heart Paperweight', 'Generic', 249, 189, 30, 'Heart-shaped glass paperweight with a polished finish.'],
      ['Ganesha Idol, Resin, 5 inch', 'Generic', 449, 349, 20, 'Hand-painted Ganesha idol for home, office or gifting on housewarming.'],
      ['Wooden Name Plate Blank, 12 inch', 'Generic', 299, 229, 20, 'Blank wooden plate that can be personalised for a door or desk.'],
    ],
  },
  {
    slug: 'gift-sets-hampers', name: 'Gift Sets & Hampers', parent: 'gift-items', code: 'HM',
    description: 'Ready-made gift boxes and hampers for every occasion.',
    rows: [
      ['Chocolate Gift Box with Teddy', 'Generic', 599, 449, 25, 'Box of assorted chocolates paired with a small teddy, ready to gift.'],
      ['Birthday Gift Hamper for Kids', 'Generic', 799, 599, 15, 'Hamper with a notebook, colours, a small toy and a card for a child\'s birthday.'],
      ['Rakhi Gift Set with Chocolates', 'Generic', 399, 299, 40, 'Rakhi thread, roli-chawal and a few chocolates in a pretty box.'],
      ['Diwali Diya and Candle Gift Set', 'Generic', 499, 399, 25, 'Handpainted diyas and scented candles in a festive gift box.'],
      ['Stationery Gift Set for Students', 'Generic', 499, 379, 30, 'Notebook, pens, pencil box and sticky notes packed as a gift.'],
      ['Premium Pen Gift Set (2 Pens in Box)', 'Parker', 599, 499, 20, 'Two smooth-writing pens in a presentation box, suited to office gifting.'],
      ['Mini Dry Fruit Gift Box', 'Generic', 549, 449, 20, 'Assorted almonds, cashews and raisins in a festive gift box.'],
      ['Teddy and Greeting Card Combo', 'Generic', 449, 349, 30, 'A soft teddy bear with a greeting card for birthdays and Valentine\'s Day.'],
    ],
  },
  {
    slug: 'greeting-wrapping', name: 'Greeting Cards & Wrapping', parent: 'gift-items', code: 'GC',
    description: 'Greeting cards, gift wrap, bags and ribbons.',
    rows: [
      ['Birthday Greeting Card with Envelope', 'Archies', 80, 59, 90, 'Colourful birthday card with a heartfelt message inside and a matching envelope.'],
      ['Anniversary Greeting Card, Musical', 'Archies', 199, 149, 35, 'Pop-up anniversary card that plays a short tune when opened.'],
      ['Gift Wrapping Paper, 10 Sheets', 'Generic', 120, 89, 80, 'Ten sheets of printed wrapping paper in assorted designs.'],
      ['Paper Gift Bags, Pack of 12', 'Generic', 199, 149, 60, 'Twelve handled gift bags in assorted colours and medium size.'],
      ['Satin Ribbon Roll Set, 10 Colours', 'Generic', 140, 105, 70, 'Ten rolls of satin ribbon for bows and gift decoration.'],
      ['Gift Tags with String, Pack of 50', 'Generic', 70, 55, 90, 'Fifty kraft paper tags with jute string for labelling gifts.'],
      ['Thank You Cards, Pack of 10', 'Archies', 149, 119, 50, 'Ten simple thank-you cards with envelopes.'],
      ['Gift Box, Medium with Lid (Pack of 3)', 'Generic', 249, 189, 40, 'Three sturdy gift boxes with lids, ready to fill.'],
    ],
  },
  {
    slug: 'keychains-accessories', name: 'Keychains & Accessories', parent: 'gift-items', code: 'KC',
    description: 'Keychains, wallets, bands and small accessories for gifting.',
    rows: [
      ['Metal Keychain, Assorted Designs', 'Generic', 99, 69, 100, 'Sturdy metal keychain with a stylish charm.'],
      ['Couple Keychain Set of 2', 'Generic', 249, 179, 45, 'Matching keychains for couples, in a small gift pack.'],
      ['Name Letter Keychain, A to Z', 'Generic', 129, 89, 80, 'Metal letter keychain in your choice of initial.'],
      ['Leather Wallet for Men', 'Generic', 499, 349, 30, 'Faux leather wallet with card slots and a coin pocket.'],
      ['Friendship Bands, Pack of 12', 'Generic', 149, 99, 70, 'Twelve colourful friendship bands to share and gift.'],
      ['Scented Candle Jar, Vanilla', 'Generic', 299, 229, 35, 'Soy-blend candle in a glass jar with a soft vanilla scent.'],
      ['Hair Accessory Set for Girls, 20 Pcs', 'Generic', 249, 179, 50, 'Twenty clips, bands and scrunchies in bright colours.'],
      ['Stainless Steel Pen Stand with Photo Holder', 'Generic', 299, 229, 25, 'Desk pen stand with a photo holder, a useful gift for study tables.'],
    ],
  },

  // ======================= TOYS =======================
  {
    slug: 'soft-toys', name: 'Soft Toys', parent: 'toys', code: 'SF',
    description: 'Teddy bears, plush animals and cuddly toys.',
    rows: [
      ['Teddy Bear, 2 Feet, Brown', 'Generic', 799, 599, 20, 'Soft and huggable brown teddy bear with a red bow.'],
      ['Teddy Bear, 3 Feet, White', 'Generic', 1299, 999, 12, 'Large white teddy with a plush finish; a popular birthday and anniversary gift.'],
      ['Panda Soft Toy, 30 cm', 'Generic', 399, 299, 30, 'Cuddly panda with a smooth plush finish and washable fabric.'],
      ['Unicorn Soft Toy, 35 cm', 'Generic', 449, 349, 25, 'Pastel unicorn with a rainbow mane, loved by little girls.'],
      ['Elephant Soft Toy, 25 cm', 'Generic', 349, 249, 30, 'Gentle grey elephant with floppy ears, soft and safe for kids.'],
      ['Dog Soft Toy, 28 cm', 'Generic', 349, 249, 30, 'Floppy-eared puppy plush with embroidered eyes, safe for toddlers.'],
      ['Soft Toy Heart Pillow, Red', 'Generic', 299, 219, 35, 'Heart-shaped cushion toy, a romantic gift.'],
      ['Pink Teddy Bear, 1 Foot', 'Generic', 299, 199, 40, 'Small pink teddy, perfect for gifting with chocolates or cards.'],
    ],
  },
  {
    slug: 'cars-vehicles', name: 'Cars & Vehicles', parent: 'toys', code: 'CV',
    description: 'Die-cast cars, remote-control cars, trains and playsets.',
    rows: [
      ['Hot Wheels Single Car, Assorted', 'Hot Wheels', 199, 169, 80, 'Die-cast 1:64 scale car in a random design; collectible and fast on the track.'],
      ['Remote Control Racing Car, Rechargeable', 'Generic', 999, 749, 20, 'High-speed RC car with rechargeable battery and a 2.4 GHz remote.'],
      ['Pull Back Cars, Set of 6', 'Generic', 349, 249, 40, 'Six friction pull-back cars that zoom forward when released.'],
      ['Battery Operated Train Set', 'Generic', 799, 599, 15, 'Toy train with lights, sound and a circular track.'],
      ['Fire Truck Toy with Light and Sound', 'Generic', 549, 399, 25, 'Friction-powered fire engine with a siren and flashing lights.'],
      ['JCB Excavator Toy, Friction', 'Generic', 449, 329, 25, 'Construction vehicle with a movable arm and bucket.'],
      ['Police Car Toy with Siren', 'Generic', 399, 299, 30, 'Pull-back police car with a loud siren and flashing light.'],
      ['Mini Truck Carrier with 6 Cars', 'Generic', 699, 549, 20, 'Big truck that carries six small cars; a complete playset.'],
    ],
  },
  {
    slug: 'puzzles-games', name: 'Puzzles & Board Games', parent: 'toys', code: 'PZ',
    description: 'Jigsaw puzzles, board games, cards and family games.',
    rows: [
      ['Jigsaw Puzzle 100 Pieces, Animals', 'Funskool', 199, 159, 40, 'One hundred-piece jigsaw with a colourful animal picture for ages 5 and up.'],
      ['Jigsaw Puzzle 500 Pieces, Landscape', 'Funskool', 449, 349, 20, 'Five hundred-piece scenic puzzle for older kids and adults.'],
      ['Ludo and Snakes and Ladders Board', 'Funskool', 199, 149, 50, 'Double-sided classic board games with dice and tokens.'],
      ['Business Board Game, Indian Edition', 'Funskool', 499, 399, 20, 'Buy and sell famous Indian properties in this family classic.'],
      ['Playing Cards, 54 Cards (Pack of 2)', 'Generic', 120, 89, 80, 'Two plastic-coated decks of 54 cards for family game nights.'],
      ['Uno Card Game', 'Mattel', 249, 199, 45, 'The colourful matching card game for two to ten players.'],
      ['Mini Rubik\'s Cube 3x3', 'Generic', 199, 149, 50, 'Smooth-turning 3x3 speed cube with bright stickerless colours.'],
      ['Tic Tac Toe Wooden Board Game', 'Generic', 249, 179, 30, 'Wooden board with X and O pieces; a quick game for two.'],
    ],
  },
  {
    slug: 'building-blocks', name: 'Building Blocks', parent: 'toys', code: 'BB',
    description: 'Block sets, construction kits and creative building toys.',
    rows: [
      ['Building Blocks Set, 100 Pieces', 'Funskool', 399, 299, 40, 'Colourful interlocking blocks to build houses, cars and animals.'],
      ['Building Blocks Set, 250 Pieces with Baseplate', 'Funskool', 799, 599, 20, 'Large block set with a green baseplate and a ideas booklet.'],
      ['Wooden Building Blocks, 50 Pieces', 'Generic', 549, 429, 25, 'Natural wooden blocks in various shapes for stacking and creative play.'],
      ['Magnetic Blocks, 40 Pieces', 'Generic', 899, 699, 15, 'Magnetic shapes that snap together for three-dimensional building.'],
      ['City Police Station Building Set', 'Generic', 699, 549, 20, 'Police station build kit with mini figures and a car.'],
      ['Alphabet Blocks, Wooden', 'Generic', 349, 269, 30, 'Twenty-six wooden blocks with letters and pictures for early learners.'],
      ['Number Blocks Learning Set', 'Generic', 349, 269, 30, 'Soft foam number blocks for counting and playing.'],
      ['Kids Tool Set with Drill', 'Generic', 599, 449, 20, 'Toy tool kit with a drill, hammer and screwdriver for pretend play.'],
    ],
  },
  {
    slug: 'educational-toys', name: 'Educational Toys', parent: 'toys', code: 'ED',
    description: 'Learning toys, flash cards, activity sets and science kits.',
    rows: [
      ['Alphabet and Number Flash Cards', 'Generic', 249, 179, 45, 'Illustrated flash cards that teach letters and numbers with pictures.'],
      ['Wooden Shape Sorter Puzzle', 'Generic', 349, 269, 30, 'Chunky wooden shapes that fit into matching slots; good for toddlers.'],
      ['Kids Abacus, Wooden 100 Beads', 'Generic', 299, 229, 30, 'Colourful abacus for counting and basic arithmetic.'],
      ['Science Experiment Kit, 20 Activities', 'Generic', 799, 599, 15, 'Hands-on kit with experiments such as volcano, slime and magnetism.'],
      ['Magnetic Drawing Board for Kids', 'Generic', 449, 349, 30, 'Write and draw with a magnetic pen, then wipe clean with a slider.'],
      ['LCD Writing Tablet, 8.5 inch', 'Generic', 399, 299, 40, 'Reusable colourful LCD tablet for drawing and doodling without paper.'],
      ['Clock Learning Toy, Wooden', 'Generic', 299, 229, 25, 'Wooden clock with movable hands that helps kids learn to tell time.'],
      ['World Map Puzzle, 60 Pieces', 'Funskool', 349, 279, 20, 'Learn countries and continents while solving this map puzzle.'],
    ],
  },
  {
    slug: 'dolls-role-play', name: 'Dolls & Role Play', parent: 'toys', code: 'DL',
    description: 'Dolls, kitchen sets, doctor sets and pretend-play toys.',
    rows: [
      ['Barbie Doll, Basic', 'Barbie', 499, 429, 25, 'Classic Barbie doll with stylish clothes and poseable arms and legs.'],
      ['Baby Doll with Feeding Bottle', 'Generic', 449, 349, 25, 'Soft baby doll with a bottle and a dummy, for nurturing play.'],
      ['Kitchen Set for Girls, 25 Pieces', 'Generic', 699, 549, 20, 'Plastic cookware, utensils and plates in a carry box.'],
      ['Doctor Set for Kids, 15 Pieces', 'Generic', 449, 349, 25, 'Stethoscope, injection, thermometer and more in a carry case.'],
      ['Doll House with Furniture', 'Generic', 999, 799, 10, 'Two-storey plastic doll house with furniture and a family of dolls.'],
      ['Makeup Kit for Girls, Pretend Play', 'Generic', 349, 249, 30, 'Safe pretend play makeup set with mirror and brush.'],
      ['Superhero Action Figure, 6 inch', 'Generic', 349, 279, 25, 'Poseable superhero figure with movable joints.'],
      ['Toy Gun with Foam Darts', 'Generic', 399, 299, 25, 'Soft dart blaster with a dozen foam darts, safe for indoor play.'],
    ],
  },

  // ======================= SPORTS ITEMS =======================
  {
    slug: 'cricket', name: 'Cricket', parent: 'sports-items', code: 'CR',
    description: 'Bats, balls, stumps and gear for gully and school cricket.',
    rows: [
      ['Kashmir Willow Cricket Bat, Full Size', 'Generic', 899, 699, 15, 'Kashmir willow bat with a rubber grip, good for tennis ball and practice.'],
      ['Plastic Cricket Bat for Kids, Size 4', 'Generic', 299, 229, 30, 'Light plastic bat suitable for young kids and indoor play.'],
      ['Tennis Cricket Ball, Pack of 6', 'Generic', 399, 299, 45, 'Six heavy tennis balls for gully cricket matches.'],
      ['Cosco Leather Cricket Ball, Red', 'Cosco', 349, 299, 25, 'Red leather ball with a four-piece stitched cover, for school-level matches.'],
      ['Wooden Cricket Stumps Set with Bails', 'Generic', 449, 349, 20, 'Set of three stumps with two bails and a carry bag.'],
      ['Cricket Batting Gloves, Youth', 'Generic', 499, 399, 20, 'Cushioned gloves for kids with a breathable back.'],
      ['Cricket Helmet, Adjustable', 'Generic', 799, 649, 10, 'Protective helmet with a steel grille and adjustable chin strap.'],
      ['Cricket Kit Bag, Medium', 'Generic', 999, 799, 10, 'Roomy kit bag for bats, pads and helmets with a shoulder strap.'],
    ],
  },
  {
    slug: 'badminton', name: 'Badminton', parent: 'sports-items', code: 'BD',
    description: 'Rackets, shuttlecocks, nets and badminton accessories.',
    rows: [
      ['Badminton Racket Pair with Cover', 'Cosco', 599, 449, 25, 'Two lightweight aluminium rackets with a carry cover, good for beginners.'],
      ['Yonex Mavis 10 Nylon Shuttlecock, Pack of 6', 'Yonex', 499, 429, 30, 'Durable nylon shuttlecocks used for club and practice play.'],
      ['Feather Shuttlecocks, Pack of 10', 'Generic', 549, 449, 20, 'Ten feather shuttlecocks with a cork base for faster play.'],
      ['Badminton Net with Poles Set', 'Generic', 799, 649, 12, 'Portable net with adjustable poles for garden or street play.'],
      ['Badminton Grip Tape, Pack of 3', 'Yonex', 129, 99, 60, 'Absorbent overgrip for a firm hold on the racket.'],
      ['Wrist Band and Headband Set', 'Generic', 199, 149, 40, 'Cotton sweatband set for sports and gym.'],
      ['Badminton Kit Bag, Single Zip', 'Generic', 499, 399, 20, 'Light kit bag to hold two rackets and shuttles.'],
    ],
  },
  {
    slug: 'football-volleyball', name: 'Football & Volleyball', parent: 'sports-items', code: 'FB',
    description: 'Footballs, volleyballs, basketballs and pumps.',
    rows: [
      ['Football, Size 5, Rubber Moulded', 'Nivia', 599, 449, 25, 'Durable size-5 football for school and street play.'],
      ['Football, Size 3, for Kids', 'Cosco', 399, 299, 25, 'Small, soft football for young kids.'],
      ['Volleyball, Size 4', 'Nivia', 549, 429, 20, 'Soft-touch volleyball with a durable cover and butyl bladder.'],
      ['Basketball, Size 7', 'Cosco', 699, 549, 15, 'Rubber basketball with deep channels for a good grip.'],
      ['Ball Pump with Needle', 'Generic', 199, 149, 50, 'Hand pump with a needle for footballs, volleyballs and basketballs.'],
      ['Football Shin Guards, Pair', 'Nivia', 299, 229, 25, 'Lightweight shin guards with elastic straps.'],
      ['Goalkeeper Gloves, Youth', 'Generic', 449, 349, 15, 'Padded gloves with latex palms for a better catch.'],
    ],
  },
  {
    slug: 'fitness-indoor', name: 'Fitness & Indoor Games', parent: 'sports-items', code: 'FI',
    description: 'Skipping ropes, yoga mats, carrom, chess and fitness basics.',
    rows: [
      ['Skipping Rope, Adjustable with Counter', 'Generic', 299, 199, 60, 'Adjustable rope with a digital counter for fitness and warm-ups.'],
      ['Yoga Mat 6 mm with Strap', 'Generic', 699, 499, 25, 'Anti-skid 6 mm yoga mat with a carry strap.'],
      ['Carrom Board 24 inch with Coins', 'Generic', 999, 799, 10, 'Medium carrom board with a striker, powder and a full set of coins.'],
      ['Chess Board, Folding with Pieces', 'Generic', 449, 349, 25, 'Foldable board with weighted chess pieces and storage inside.'],
      ['Resistance Band Set of 3', 'Generic', 399, 299, 30, 'Three bands with different resistance levels for home workouts.'],
      ['Hand Grip Strengthener, Pair', 'Generic', 249, 179, 35, 'Adjustable hand grips for forearm strength.'],
      ['Table Tennis Racket Set with 3 Balls', 'Cosco', 699, 549, 15, 'Two rackets and three balls for table tennis at home.'],
      ['Frisbee Flying Disc, Pack of 2', 'Generic', 249, 179, 40, 'Two lightweight discs for park and beach play.'],
    ],
  },

  // ======================= DECORATION ITEMS =======================
  {
    slug: 'welcome-decor', name: 'Welcome Decoration', parent: 'decoration-items', code: 'WL',
    description: 'Welcome banners, door hangings, rangoli and housewarming decor.',
    rows: [
      ['Welcome Home Banner, Gold Foil', 'Party Pop', 249, 179, 40, 'Shimmery gold foil "Welcome Home" banner for new homes and returning family.'],
      ['Welcome Door Hanging with Bells', 'Generic', 299, 229, 30, 'Handcrafted decorative door hanging with small bells and flowers.'],
      ['Toran for Main Door, Marigold', 'Generic', 249, 179, 40, 'Artificial marigold toran for the main entrance.'],
      ['Rangoli Stickers, Reusable Set', 'Generic', 199, 149, 45, 'Reusable floor rangoli stickers in festive designs.'],
      ['Floating Candles and Flower Bowl Set', 'Generic', 399, 299, 20, 'Floating candles with artificial petals for a warm welcome at the entrance.'],
      ['Welcome Back Balloon Kit', 'Party Pop', 349, 259, 30, 'Balloons, foil letters and curtains to welcome someone back home.'],
      ['Griha Pravesh Decoration Combo', 'Party Pop', 799, 599, 15, 'Toran, flower strings, diyas and rangoli kit for a housewarming ceremony.'],
      ['Welcome Mat, Coir 40x60 cm', 'Generic', 249, 189, 35, 'Coir doormat with a printed "Welcome" message.'],
      ['Artificial Flower Garland, 5 Feet', 'Generic', 199, 149, 50, 'Marigold and rose garland that can be reused for several functions.'],
    ],
  },
  {
    slug: 'birthday-decor', name: 'Birthday Decoration', parent: 'decoration-items', code: 'BH',
    description: 'Balloons, banners, candles and complete birthday party kits.',
    rows: [
      ['Happy Birthday Foil Banner, Gold', 'Party Pop', 149, 99, 80, 'Gold foil "Happy Birthday" letter banner that hangs across a wall.'],
      ['Birthday Balloon Combo, 51 Pieces', 'Party Pop', 499, 349, 40, 'Fifty-one metallic and latex balloons plus a banner, ribbon and glue dots.'],
      ['Birthday Decoration Kit for Boys (Blue)', 'Party Pop', 599, 449, 25, 'Blue-themed kit with banner, balloons, curtain and hanging swirls.'],
      ['Birthday Decoration Kit for Girls (Pink)', 'Party Pop', 599, 449, 25, 'Pink-themed kit with banner, balloons, curtain and hanging swirls.'],
      ['Number Foil Balloon, 32 inch (0 to 9)', 'Party Pop', 149, 109, 60, 'Large gold or silver foil number balloon for milestone birthdays.'],
      ['Birthday Candles Set, 24 Pieces with Holders', 'Generic', 79, 59, 80, 'Twenty-four coloured candles with holders for the cake.'],
      ['Cake Topper and Cupcake Toppers Set', 'Party Pop', 149, 109, 50, 'Gold glitter toppers for cakes and cupcakes.'],
      ['Foil Fringe Curtain, Rose Gold', 'Party Pop', 149, 99, 70, 'Shimmering rose gold curtain for photo backdrops.'],
      ['Party Hats, Pack of 10', 'Party Pop', 99, 69, 80, 'Ten colourful cone hats for kids\' birthday parties.'],
      ['Confetti Popper, Pack of 4', 'Party Pop', 149, 119, 40, 'Spring-loaded confetti poppers for a surprise burst of colour.'],
      ['Birthday Photo Booth Props, 25 Pieces', 'Party Pop', 299, 219, 30, 'Moustaches, glasses and speech bubbles for fun birthday photos.'],
    ],
  },
  {
    slug: 'anniversary-decor', name: 'Anniversary & Romantic Decoration', parent: 'decoration-items', code: 'AN',
    description: 'Decor for anniversaries, proposals and romantic surprises.',
    rows: [
      ['Happy Anniversary Foil Banner, Rose Gold', 'Party Pop', 199, 139, 45, 'Rose gold foil "Happy Anniversary" banner with a heart garland.'],
      ['Anniversary Decoration Kit, 55 Pieces', 'Party Pop', 699, 529, 20, 'Heart balloons, banner, curtain, petals and fairy lights for a romantic room.'],
      ['Rose Petals, Artificial, 500 Pieces', 'Generic', 249, 179, 40, 'Soft red petals to scatter on beds and tables.'],
      ['LED Fairy Lights, 10 m Warm White', 'Generic', 399, 299, 40, 'Ten-metre string with 100 warm-white LEDs, plug-in.'],
      ['Heart Shaped Foil Balloons, Pack of 10', 'Party Pop', 249, 179, 45, 'Ten red and pink heart foil balloons.'],
      ['Love Heart Wall Hanging, Wooden', 'Generic', 349, 259, 25, 'Wooden "Love" wall hanging, a sweet gift and decor piece.'],
      ['Romantic Candle Set with Tea Lights', 'Generic', 349, 269, 30, 'Pillar candles and 20 tea lights for a dinner-at-home setup.'],
      ['Proposal Decoration Kit, "Will You Marry Me"', 'Party Pop', 799, 599, 15, 'Lighted letters, balloons and petals for a romantic proposal.'],
      ['Couple Balloon Bouquet, Pack of 12', 'Party Pop', 349, 259, 30, 'Twelve heart and star balloons ready to tie up as a bouquet.'],
    ],
  },
  {
    slug: 'baby-shower-decor', name: 'Baby Shower & Baby Welcome', parent: 'decoration-items', code: 'BS',
    description: 'Baby shower, welcome baby, naming ceremony and first birthday decor.',
    rows: [
      ['Baby Shower Banner, Gold Foil', 'Party Pop', 199, 149, 40, 'Gold foil letter banner reading "Baby Shower".'],
      ['Welcome Baby Boy Decoration Kit', 'Party Pop', 699, 529, 20, 'Blue theme kit with banner, balloons and hanging swirls for a new baby boy.'],
      ['Welcome Baby Girl Decoration Kit', 'Party Pop', 699, 529, 20, 'Pink theme kit with banner, balloons and hanging swirls for a new baby girl.'],
      ['Baby Shower Balloon Set, 40 Pieces', 'Party Pop', 399, 299, 30, 'Pastel balloons with printed baby shower foil stars.'],
      ['Baby Shower Sash for Mom-to-Be', 'Generic', 199, 149, 35, 'Satin sash with a glitter "Mom to Be" print.'],
      ['It\'s a Boy / It\'s a Girl Balloon Letters', 'Party Pop', 249, 189, 30, 'Foil letters spelling the message of your choice.'],
      ['Baby\'s First Birthday Decoration Kit', 'Party Pop', 799, 599, 20, 'Banner, high chair banner, balloons and crown for a first birthday.'],
      ['Naming Ceremony (Namkaran) Decor Kit', 'Party Pop', 649, 499, 15, 'Floral banner, hanging swirls and balloons for a naming ceremony.'],
      ['Cradle Decoration Flowers Set, Artificial', 'Generic', 399, 299, 20, 'Artificial flowers and ribbons to decorate a cradle or jhula.'],
    ],
  },
  {
    slug: 'wedding-festive-decor', name: 'Wedding & Festive Decoration', parent: 'decoration-items', code: 'FS',
    description: 'Diwali, Navratri, Ganesh Chaturthi, Eid, Christmas and wedding decor.',
    rows: [
      ['Diwali LED String Lights, 10 m Multicolour', 'Generic', 349, 249, 50, 'Ten-metre string of multi-colour LEDs for balconies and windows.'],
      ['Diwali Diya Set, 12 Clay Diyas Painted', 'Generic', 249, 179, 40, 'Twelve painted clay diyas, ready to light.'],
      ['Paper Lantern (Akash Kandil), Pack of 2', 'Generic', 399, 299, 25, 'Two foldable star-shaped lanterns for Diwali.'],
      ['Ganesh Chaturthi Decoration Backdrop', 'Generic', 799, 599, 12, 'Fabric backdrop with floral print and lights for an idol setup.'],
      ['Navratri Dandiya Sticks, Pair', 'Generic', 199, 149, 40, 'Wooden dandiya sticks with colourful decorative tape.'],
      ['Eid Mubarak Banner and Lights Set', 'Party Pop', 449, 349, 20, 'Gold crescent banner with warm LED lights for Eid.'],
      ['Christmas Tree 4 Feet with Ornaments', 'Generic', 999, 799, 10, 'Artificial tree with baubles and a star topper.'],
      ['Wedding Entrance Floral Decoration Set', 'Generic', 1299, 999, 8, 'Marigold and rose strings with fabric accents for a wedding entrance.'],
      ['Table Runner and Fairy Lights Set', 'Generic', 449, 349, 20, 'Embroidered table runner with battery fairy lights for dinner tables.'],
    ],
  },
  {
    slug: 'party-lights-props', name: 'Party Lights & Props', parent: 'decoration-items', code: 'PL',
    description: 'LED lights, curtains, photo props and general party supplies.',
    rows: [
      ['LED Curtain Lights, 3 m Warm White', 'Generic', 599, 449, 30, 'Waterfall string light curtain to make any wall glow at parties.'],
      ['Disco Ball LED Light', 'Generic', 399, 299, 25, 'Rotating colourful lights for dance floors and birthdays.'],
      ['Paper Fans and Pom-Poms Set, Pack of 12', 'Party Pop', 349, 259, 30, 'Twelve tissue fans and pom-poms in matching pastel colours.'],
      ['Metallic Fringe Curtain, Silver', 'Party Pop', 149, 99, 70, 'Silver foil fringe backdrop for photo areas.'],
      ['Photo Booth Frame Prop, Printable Board', 'Party Pop', 299, 219, 20, 'Fun cardboard photo frame prop with a handle.'],
      ['Table Cover Plastic, Gold (Pack of 3)', 'Party Pop', 149, 119, 40, 'Three disposable table covers in a shiny gold finish.'],
      ['Paper Plates and Cups Set, 40 Pieces', 'Party Pop', 249, 189, 50, 'Disposable party plates and cups in matching colours.'],
      ['Balloon Pump, Hand Operated', 'Generic', 99, 79, 80, 'Double-action hand pump to inflate balloons easily.'],
      ['Glow Sticks, Pack of 50', 'Generic', 299, 219, 35, 'Fifty bright glow sticks and connectors for parties and concerts.'],
    ],
  },

  // ======================= PERFUMES (all under Rs 299) =======================
  {
    slug: 'deodorants-body-sprays', name: 'Deodorants & Body Sprays', parent: 'perfumes', code: 'DE',
    description: 'Everyday deodorant sprays for men and women, under Rs 299.',
    rows: [
      ['Fogg Fresh Aqua Deodorant, 120 ml', 'Fogg', 249, 199, 60, 'Gas-free aquatic fragrance in a spray that stays fresh through the day.'],
      ['Engage Man Urge Deodorant, 150 ml', 'Engage', 249, 199, 50, 'Bold, woody fragrance for men that holds through a long day.'],
      ['Park Avenue Storm Deodorant, 150 ml', 'Park Avenue', 299, 249, 40, 'Fresh mens deodorant with a crisp, cool scent.'],
      ['Wild Stone Edge Deodorant, 150 ml', 'Wild Stone', 299, 249, 40, 'Spicy and woody deodorant for men, a popular daily choice.'],
      ['Engage Woman Blush Deodorant, 150 ml', 'Engage', 249, 199, 45, 'Floral, soft deodorant spray made for women.'],
      ['Fogg Black Series Deodorant, 150 ml', 'Fogg', 299, 249, 45, 'Strong dark fragrance that stays with you through the day.'],
      ['Denver Hamilton Deodorant, 165 ml', 'Denver', 249, 199, 40, 'Woody and oriental deodorant spray for men.'],
      ['Nivea Fresh Active Deodorant, 150 ml', 'Nivea', 299, 249, 35, 'Cool and light everyday deodorant that gives all-day freshness.'],
      ['Layer\'r Shot Blue Deodorant, 135 ml', 'Layer\'r', 299, 249, 35, 'Zesty, energetic fragrance in a compact spray.'],
    ],
  },
  {
    slug: 'perfume-sprays', name: 'Perfume Sprays', parent: 'perfumes', code: 'PF',
    description: 'Eau de parfum and eau de toilette sprays for men and women, under Rs 299.',
    rows: [
      ['Wild Stone Code Perfume, 30 ml', 'Wild Stone', 299, 249, 35, 'Compact perfume spray with a bold, masculine blend.'],
      ['Park Avenue Good Morning Perfume, 30 ml', 'Park Avenue', 299, 239, 30, 'Light and fresh perfume for everyday office wear.'],
      ['Engage Rush Perfume Spray for Men, 30 ml', 'Engage', 299, 239, 30, 'Citrusy and spicy EDP spray with good staying power.'],
      ['Engage Eternal Perfume Spray for Women, 30 ml', 'Engage', 299, 239, 30, 'Soft, floral perfume for women in a handy pocket size.'],
      ['Denver Imperial Perfume, 30 ml', 'Denver', 299, 249, 25, 'Smooth, long-lasting perfume for men.'],
      ['Fogg Scent Master, 25 ml Pocket Perfume', 'Fogg', 249, 199, 40, 'Pocket-sized perfume that fits in a bag or pocket.'],
      ['Layer\'r Exotic Perfume Spray, 25 ml', 'Layer\'r', 299, 249, 25, 'Sweet, exotic fragrance in a small pack.'],
      ['Skinn by Titan Sheer Pocket Perfume, 20 ml', 'Skinn', 299, 275, 20, 'Mini pocket perfume with a soft floral note.'],
    ],
  },
  {
    slug: 'attar-roll-on', name: 'Attar & Roll-ons', parent: 'perfumes', code: 'AT',
    description: 'Alcohol-free attars and roll-on perfumes, under Rs 299.',
    rows: [
      ['Musk Attar Roll-on, 6 ml', 'Generic', 199, 149, 50, 'Traditional alcohol-free musk attar in an easy roll-on bottle.'],
      ['Rose Attar Roll-on, 6 ml', 'Generic', 199, 149, 50, 'Sweet rose attar that is gentle on skin and long lasting.'],
      ['Khus Attar Roll-on, 6 ml', 'Generic', 199, 149, 40, 'Cooling earthy khus fragrance, ideal for summers.'],
      ['Sandal Attar Roll-on, 6 ml', 'Generic', 249, 199, 40, 'Warm sandalwood attar with a smooth woody scent.'],
      ['Jannat-ul-Firdaus Attar, 10 ml', 'Generic', 299, 249, 25, 'Classic floral attar in a glass bottle, a popular festive gift.'],
      ['Black Oud Roll-on, 8 ml', 'Generic', 299, 259, 20, 'Rich oud-style roll-on perfume oil.'],
      ['Mini Attar Gift Set, 3 x 3 ml', 'Generic', 299, 249, 25, 'Three small attars in a pretty box, easy to gift.'],
    ],
  },
  {
    slug: 'fragrance-gift-sets', name: 'Fragrance Gift Sets', parent: 'perfumes', code: 'GS',
    description: 'Perfume and deodorant gift sets under Rs 299.',
    rows: [
      ['Fogg Deo + Perfume Gift Set (Men)', 'Fogg', 349, 279, 20, 'Small deodorant and pocket perfume packed together for gifting.'],
      ['Engage Mini Perfume Duo for Women, 2 x 18 ml', 'Engage', 299, 249, 25, 'Two mini perfumes in a gift box for her.'],
      ['Wild Stone Mini Perfume Trio, 3 x 10 ml', 'Wild Stone', 299, 249, 25, 'Three small perfume bottles to try different scents.'],
      ['Park Avenue Deodorant Duo, 2 x 40 ml', 'Park Avenue', 299, 249, 20, 'Two travel-size deodorants in one pack.'],
      ['Body Mist Gift Combo, Pack of 3', 'Generic', 299, 249, 25, 'Three light body mists in fruity and floral notes.'],
      ['Travel Perfume Atomizer with Perfume, 30 ml', 'Generic', 249, 199, 30, 'Refillable travel atomizer supplied with a 30 ml perfume.'],
    ],
  },
];
