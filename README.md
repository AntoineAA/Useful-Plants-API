# Useful-Plants-API

Useful-Plants-API is under a GNU General Public License Version 3 (see LICENSE)

Author: Antoine AFFOUARD


IT tools to collect and disseminate botanical information to the general public. A state of the art of biodiversity informatics allowed highlighting relevant practices and data sources to create a mobile application for the discovery of useful plants and their uses ([GRIN](http://www.ars-grin.gov/)). The tools, developed on a server, enable the automated acquisition of biological and ecological data, from aggregators such as [GBIF](http://www.gbif.org/) or [EOL](http://eol.org/), through Web services that are normalized by the use of API. The information hence collected meet international nomenclatural standards, making easier their treatment and integration into a new system. These data, once indexed in a search engine, are made available on the Internet through several API for their use from mobile terminals. The Android application offers the possibility to explore data through an entry point on plant uses or to contextualize the consultation according to the geographical position of the user.

## Installation - Ubuntu Server 14.04

### Setting up the environment

#### Java
```
sudo apt-get install default-jre
```

#### [Node.js](https://nodejs.org/en/) for server-side applications written in JavaScript
```
sudo apt-get install nodejs
sudo apt-get install nodejs-legacy
```

#### [npm](https://www.npmjs.com/) package manager for JavaScript
```
sudo apt-get install npm
sudo apt-get install build-essential
```

#### [Node.js](https://nodejs.org/en/) v5.x / [npm](https://www.npmjs.com/)
```
curl -sL https://deb.nodesource.com/setup_5.x | sudo bash -
sudo apt-get install nodejs
sudo apt-get autoremove
```

#### [Apache CouchDB](http://couchdb.apache.org/) document-oriented NoSQL database that uses JSON to store data
```
sudo apt-get install couchdb
```

#### [elasticsearch](http://www.elasticsearch.org/) search server based on Lucene
Download and install: https://www.elastic.co/downloads or add the repository (example for 1.4.x)
```
wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb http://packages.elastic.co/elasticsearch/1.4/debian stable main" | sudo tee -a /etc/apt/sources.list
sudo apt-get update && sudo apt-get install elasticsearch
```
Running elasticsearch as service
```
sudo update-rc.d elasticsearch defaults 95 10
sudo service elasticsearch start
```
check: http://localhost:9200/

Save the original configuration file
```
sudo cp /etc/elasticsearch/elasticsearch.yml /etc/elasticsearch/elasticsearch.yml.save
```
Non dynamic node name (set the node.name property)
```
sudo nano /etc/elasticsearch/elasticsearch.yml
node.name: "node-zero" 
```
Cluster name (set the cluster.name property)
```
sudo nano /etc/elasticsearch/elasticsearch.yml
cluster.name: "test-1.4.4" 
```
Restart the service
```
sudo service elasticsearch restart
```
check: http://localhost:9200/

#### Plugin [elasticsearch-head](https://github.com/mobz/elasticsearch-head)
```
sudo /usr/share/elasticsearch/bin/plugin -install mobz/elasticsearch-head
sudo service elasticsearch restart
```
check: http://localhost:9200/_plugin/head/

#### Plugin [elasticsearch-river-couchdb](https://github.com/elastic/elasticsearch-river-couchdb)
**Warning**: you need to install a version matching your elasticsearch version
```
sudo /usr/share/elasticsearch/bin/plugin -install elasticsearch/elasticsearch-river-couchdb/2.4.2
sudo service elasticsearch restart
```

#### Images / Thumbnails management
```
sudo apt-get install imagemagick
```

#### Helpful
```
sudo apt-get install curl
```

### Setting up the project

#### Create new database
```
curl -X PUT localhost:5984/floristic_soft
```
check: [Futon](http://localhost:5984/_utils/)

#### Mapping [CouchDB documents vs. elasticsearch objects]
```
curl -XPUT 'localhost:9200/floristic_soft/' -d '{
    "mappings": {
        "species": {
            "properties": {
                "_id": { "type": "string", "include_in_all": false },
                "_rev": { "type": "string", "include_in_all": false },
                "id": { "type": "integer", "include_in_all": false },
                "genus_id": { "type": "integer", "include_in_all": false },
                "created": { "type": "date", "include_in_all": false },
                "modified": { "type": "date", "include_in_all": false },
                "comment": { "type": "string", "include_in_all": false },
                "name": {
                    "type": "multi_field",
                    "fields": {
                        "name": {"type": "string", "index": "analyzed"},
                        "untouched": {"type": "string", "index": "not_analyzed"}
                    }
                },
                "author": {
                    "type": "multi_field",
                    "fields": {
                        "author": {"type": "string", "index": "analyzed"},
                        "untouched": {"type": "string", "index": "not_analyzed"}
                    }
                },
                "family": {
                    "type": "object",
                    "properties": {
                        "id": { "type": "integer", "include_in_all": false },
                        "created": { "type": "date", "include_in_all": false },
                        "modified": { "type": "date", "include_in_all": false },
                        "comment": { "type": "string", "include_in_all": false },
                        "name": {
                            "type": "multi_field",
                            "fields": {
                                "name": {"type": "string", "index": "analyzed"},
                                "untouched": {"type": "string", "index": "not_analyzed"}
                            }
                        },
                        "author": {
                            "type": "multi_field",
                            "fields": {
                                "author": {"type": "string", "index": "analyzed"},
                                "untouched": {"type": "string", "index": "not_analyzed"}
                            }
                        }
                    }
                },
                "genus": {
                    "type": "object",
                    "properties": {
                        "id": { "type": "integer", "include_in_all": false },
                        "family_id": { "type": "integer", "include_in_all": false },
                        "created": { "type": "date", "include_in_all": false },
                        "modified": { "type": "date", "include_in_all": false },
                        "comment": { "type": "string", "include_in_all": false },
                        "name": {
                            "type": "multi_field",
                            "fields": {
                                "name": {"type": "string", "index": "analyzed"},
                                "untouched": {"type": "string", "index": "not_analyzed"}
                            }
                        },
                        "author": {
                            "type": "multi_field",
                            "fields": {
                                "author": {"type": "string", "index": "analyzed"},
                                "untouched": {"type": "string", "index": "not_analyzed"}
                            }
                        },
                        "commons": {
                            "type": "nested",
                            "properties": {
                                "language": {
                                    "type": "multi_field",
                                    "fields": {
                                        "language": {"type": "string", "index": "analyzed"},
                                        "untouched": {"type": "string", "index": "not_analyzed"}
                                    }
                                },
                                "code": { "type": "string", "include_in_all": false },
                                "names": {
                                    "type": "multi_field",
                                    "fields": {
                                        "names": {"type": "string", "index": "analyzed"},
                                        "untouched": {"type": "string", "index": "not_analyzed"}
                                    }
                                }
                            }
                        }
                    }
                },
                "usages": {
                    "type": "nested",
                    "properties": {
                        "usage": {
                            "type": "multi_field",
                            "fields": {
                                "usage": {"type": "string", "index": "analyzed"},
                                "untouched": {"type": "string", "index": "not_analyzed"}
                            }
                        },
                        "names": {
                            "type": "multi_field",
                            "fields": {
                                "names": {"type": "string", "index": "analyzed"},
                                "untouched": {"type": "string", "index": "not_analyzed"}
                            }
                        }
                    }
                },
                "commons": {
                    "type": "nested",
                    "properties": {
                        "language": {
                            "type": "multi_field",
                            "fields": {
                                "language": {"type": "string", "index": "analyzed"},
                                "untouched": {"type": "string", "index": "not_analyzed"}
                            }
                        },
                        "code": { "type": "string", "include_in_all": false },
                        "names": {
                            "type": "multi_field",
                            "fields": {
                                "names": {"type": "string", "index": "analyzed"},
                                "untouched": {"type": "string", "index": "not_analyzed"}
                            }
                        }
                    }
                },
                "gbif_key": { "type": "integer", "include_in_all": false },
                "gbif_error": { "type": "boolean", "include_in_all": false },
                "eol_id": { "type": "integer", "include_in_all": false },
                "eol_error": { "type": "boolean", "include_in_all": false },
                "media": {
                    "type": "nested",
                    "properties": {
                        "floris_source": { "type": "string", "include_in_all": false },
                        "floris_media_url": { "type": "string", "include_in_all": false },
                        "floris_media_type": { "type": "string", "include_in_all": false },
                        "floris_media_title": { "type": "string", "include_in_all": false },
                        "floris_media_description": { "type": "string", "include_in_all": false },
                        "floris_media_author": { "type": "string", "include_in_all": false },
                        "floris_media_licence": { "type": "string", "include_in_all": false },
                        "source": {"type": "object", "include_in_all": false }
                    }
                },
                "traits": {
                    "type": "nested",
                    "properties": {
                        "name": {
                            "type": "multi_field",
                            "include_in_all": false,
                            "fields": {
                                "name": {"type": "string", "index": "analyzed", "include_in_all": false},
                                "untouched": {"type": "string", "index": "not_analyzed", "include_in_all": false}
                            }
                        },
                        "values": {
                            "type": "multi_field",
                            "include_in_all": false,
                            "fields": {
                                "values": {"type": "string", "index": "analyzed", "include_in_all": false},
                                "untouched": {"type": "string", "index": "not_analyzed", "include_in_all": false}
                            }
                        }
                    }
                },
                "pnet_id": { "type": "string", "include_in_all": false },
                "pnet": {
                    "type": "object",
                    "properties": {
                        "image": { "type": "string", "include_in_all": false },
                        "projects": {
                            "type": "nested",
                            "properties": {
                                "id": { "type": "string", "include_in_all": false },
                                "name": {
                                    "type": "multi_field",
                                    "fields": {
                                        "name": {"type": "string", "index": "analyzed"},
                                        "untouched": {"type": "string", "index": "not_analyzed"}
                                    }
                                },
                                "description": { "type": "string", "include_in_all": false }
                            }
                        },
                        "images": {
                            "type": "nested",
                            "properties": {
                                "url": { "type": "string", "include_in_all": false },
                                "author": { "type": "string", "include_in_all": false },
                                "locality": { "type": "string", "include_in_all": false },
                                "type": {
                                    "type": "multi_field",
                                    "fields": {
                                        "type": {"type": "string", "index": "analyzed", "include_in_all": false },
                                        "untouched": {"type": "string", "index": "not_analyzed", "include_in_all": false }
                                    }
                                },
                                "date": {
                                    "type": "multi_field",
                                    "fields": {
                                        "date": { "type": "date", "format": "YYYY-MM-dd", "include_in_all": false },
                                        "untouched": { "type": "string", "index": "not_analyzed", "include_in_all": false }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}'
```

#### Create a river
```
curl -XPUT 'localhost:9200/_river/floristic_soft_river/_meta' -d '{
    "type": "couchdb",
    "couchdb": {
        "host": "localhost",
        "port": 5984,
        "db": "floristic_soft",
        "filter": null
    },
    "index": {
        "index": "floristic_soft",
        "type": "species",
        "bulk_size": "100",
        "bulk_timeout": "10ms" 
    }
}'
```

#### Do NOT run, just for information
Delete the river
```
curl -XDELETE 'localhost:9200/_river/floristic_soft_river/'
```
Delete the index
```
curl -XDELETE 'http://localhost:9200/floristic_soft/'
```

#### Update the configuration file
Copy env.json.example as env.json and update its content with your current config

#### Get the JavaScript dependencies
```
cd [...]/useful-plants-api/
npm install
```

#### Get the data sources
Download data from [GRIN](http://www.ars-grin.gov/misc/tax/)
* common.zip
* dist.zip
* econ.zip
* family.zip
* genus.zip
* species.zip

Extract dBase files (.dbf) and put them into the [...]/useful-plants-api/import/data/ directory

#### Populating the CouchDB database and the elasticsearch index
```
cd [...]/useful-plants-api/import/
nodejs ./run.js
```

#### Load Data Store / Pl@ntNet data (erases old DS / PN data)
(Login required)
```
cd [...]/useful-plants-api/import_extend/
nodejs ./run-ds.js
```

#### Load gbif data (erases old gbif data)
```
cd [...]/useful-plants-api/import_extend/
nodejs ./run-gbif.js all
```
To reload data with error (server errors...) or new data
```
nodejs ./run-gbif.js error
```

#### Load eol data (erases old eol data)
```
cd [...]/useful-plants-api/import_extend/
nodejs ./run-eol.js all
```
To reload data with error (server errors...) or new data
```
nodejs ./run-eol.js error
```

#### Testing the API
```
cd [...]/useful-plants-api/
nodejs ./node_modules/.bin/lab
```

#### Security - Create CouchDB Admin User
```
curl -X PUT http://localhost:5984/_config/admins/[admin_login] -d '"[admin_password]"'
```
Edit env.json file and update *couch_connexion_string* value (*admin_login* and *admin_password*)

#### Web - [PM2](https://github.com/Unitech/pm2) process manager for Node.js
```
sudo npm install pm2 -g
pm2 startup ubuntu
```
The last line of the resulting output will include a command that you must run

Then, start the application
```
cd [...]/useful-plants-api/
pm2 start server.js
```

#### Web - [Nginx](http://nginx.org/) reverse proxy server
```
sudo apt-get install nginx
```
Edit the default server configuration
```
sudo nano /etc/nginx/sites-available/default
```
```
server {
	listen 80;
	server_name example.com;
	location / {
		proxy_pass http://localhost:3000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}
}
```
Restart Nginx
```
sudo service nginx restart
```
Edit server.js file and update *swagger_options.basePath* value (replace *server.info.uri* with *example.com*)
