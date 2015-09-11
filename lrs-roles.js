'use strict';

/**
 * This file exports the main roles Gleaner uses which are:
 *      'developer', 'teacher' and 'student'.
 *
 * Also indicates the anonymous routes used by the gleaner-tracker module to
 * send data to the collector server.
 */

exports.app = {
    roles: [
        {
            "roles": "student",
            "allows": [
                {
                    "resources": [
                        "/games",
                        "/games/:gameId/versions",
                        "/games/:gameId/versions/:versionId",
                        "/games/:gameId/versions/:versionId/sessions/my",
                        "/sessions/:sessionId/results"
                    ],
                    "permissions": [
                        "get"
                    ]
                },
                {
                    "resources": [
                        "/sessions/:sessionId"
                    ],
                    "permissions": [
                        "put",
                        "get"
                    ]
                }
            ]
        },
        {
            "roles": "teacher",
            "allows": [
                {
                    "resources": [
                        "/games",
                        "/games/:gameId/versions",
                        "/games/:gameId/versions/:versionId",
                        "/games/:gameId/versions/:versionId/sessions/my",
                        "/sessions/:sessionId/results"

                    ],
                    "permissions": [
                        "get"
                    ]
                },
                {
                    "resources": [
                        "/sessions/:sessionId",
                        "/sessions/:sessionId/remove",
                        "/sessions/:sessionId/results/:resultsId"
                    ],
                    "permissions": [
                        "*"
                    ]
                },
                {
                    "resources": [
                        "/games/:gameId/versions/:versionId/sessions",
                        "/sessions/:sessionId/:event"
                    ],
                    "permissions": [
                        "post"
                    ]
                }
            ]
        },
        {
            "roles": "developer",
            "allows": [
                {
                    "resources": [
                        "/games/my",
                        "/games/:gameId",
                        "/games/:gameId/versions",
                        "/games/:gameId/versions/:versionId"
                    ],
                    "permissions": [
                        "*"
                    ]
                },
                {
                    "resources": [
                        "/games/statements",
                        "/games/:gameId/versions/:versionId/sessions",
                        "/sessions/:sessionId"
                    ],
                    "permissions": [
                        "get"
                    ]
                }
            ]
        }
    ],
    anonymous: [
        '/collector/start/:trackingCode',
        '/collector/track'
    ]
};