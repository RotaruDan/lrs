/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var async = require('async');


function AbstractController(transformers) {
    this.appConfig = null;
    this.status = 1;
    this.nextTransformer = null;
    this.transformers = transformers;
    this.nextTransformer = null;
    this.existingModelVersion = 1;
}

AbstractController.prototype.connect = function (config, callback) {

    this.appConfig = config;
    var that = this;
    this.doConnect(config, function (err, result) {
        if (err) {
            that.status = 1;
            return callback(err, result);
        }
        callback(null, result);
    });
};

AbstractController.prototype.refresh = function (callback) {
    var that = this;
    this.getModelVersion(this.appConfig, function (err, modelVersion) {
        if (err) {
            console.log('Cannot retrieve the model version', err);
            return callback(err);
        }

        that.existingModelVersion = modelVersion;

        // STATUS == 0 -> OK no transition required
        //        == 1 -> PENDING, transform must be performed
        //        == 2 -> ERROR, an error has happened, no update
        that.status = 0;

        if (that.existingModelVersion !== that.appConfig.elasticsearch.modelVersion) {

            for (var i = 0; i < that.transformers.length; ++i) {
                var transformer = that.transformers[i];
                if (that.existingModelVersion === transformer.version.origin) {
                    that.nextTransformer = transformer;
                    break;
                }
            }

            if (!that.nextTransformer) {
                that.status = 2;
            } else {
                that.status = 1;
            }

            // TODO check if all the transformers required exist
            // and are implemented
        }

        if (!that.nextTransformer) {
            return callback(null, {
                status: that.status
            });
        }
        callback(null, {
            status: that.status,
            requirements: that.nextTransformer.requires,
            version: that.nextTransformer.version
        });

    });
};
AbstractController.prototype.transform = function (callback) {
    var that = this;
    async.waterfall([function (newCallback) {
            console.log('Starting executing transformer ' + JSON.stringify(that.nextTransformer.version, null, 4));
            newCallback(null, that.appConfig);
        },
            that.nextTransformer.backup.bind(that.nextTransformer),
            that.nextTransformer.upgrade.bind(that.nextTransformer),
            that.nextTransformer.check.bind(that.nextTransformer)],
        function (err, result) {
            if (err) {
                console.error('Check failed (upgrade error?)');
                console.error(err);
                console.log('Trying to restore...');
                return that.nextTransformer.restore(that.appConfig, function (restoreError, result) {
                    if (restoreError) {
                        console.error('Error on while restoring the database... sorry :)');
                        return callback(restoreError);
                    }

                    console.log('Restore OK.');
                    return callback(err);
                });
            }

            console.log('Cleaning...');
            that.nextTransformer.clean(that.appConfig, function (cleanError, result) {

                if (cleanError) {
                    console.error('Cleaned failed: database might contain unused information...');
                } else {
                    console.log('Clean OK.');
                }

                that.setModelVersion(that.appConfig, function (err, result) {
                    if (err) {
                        return callback(err, result);
                    }
                    console.log('Finished transform transformers phase!');
                    callback(null, result);
                });
            });
        });
};


AbstractController.prototype.doConnect = function (config, callback) {
    throw new Error('Connect not implemented');
};
AbstractController.prototype.getModelVersion = function (config, callback) {
    throw new Error('getModelVersion not implemented');
};
AbstractController.prototype.setModelVersion = function (config, callback) {
    throw new Error('setModelVersion not implemented');
};

module.exports = AbstractController;
