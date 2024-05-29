CREATE TABLE IF NOT EXISTS unvisited (
	id INT NOT NULL,
	CONSTRAINT unvisited_id_key UNIQUE (id)
);


CREATE TABLE IF NOT EXISTS visited (
	id INT NOT NULL,
	CONSTRAINT visited_id_key UNIQUE (id)
);


CREATE TABLE IF NOT EXISTS problem (
	id INT NOT NULL,
	CONSTRAINT problem_id_key UNIQUE (id)
);


CREATE TABLE sitemap (
	id serial4 NOT NULL,
	product_id INT,
	loc text NOT NULL,
	changefreq text NULL,
	priority text NULL,
	image_url text NULL,
	CONSTRAINT sitemap_pkey PRIMARY KEY (id),
	CONSTRAINT sitemap_loc_key UNIQUE (loc),
	CONSTRAINT sitemap_product_id_key UNIQUE (product_id)
);