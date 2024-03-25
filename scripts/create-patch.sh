#!/usr/bin/env bash
# create patch for hafas-client

if [ ! -d "./node_modules/patch-package" ]; then
    echo "please install patch-package"
    exit 1
fi

if [ ! -d "./node_modules/hafas-client" ]; then
    echo "please install hafas-client"
    exit 1
fi

list=$(find node_modules/hafas-client/p -type d)

for dir in $list; do
    indexFile=$dir/index.js
    baseFile=$dir/base.json
    if [ -f "$indexFile" ] && [ -f "$baseFile" ]; then
        grep Require $indexFile > /dev/null
        if [ $? -eq 0 ]; then
            echo "change $indexFile"

            sed -i '/createRequire/d' $indexFile
            sed -i "s/^const baseProfile = require.*$/import baseProfile from '.\/base.json' with { type: 'json' };/" $indexFile

        fi
    fi
    loyaltyCards=$dir/loyalty-cards.js
    if [ -f "$loyaltyCards" ]; then
        sed -i '/node:assert/d' $loyaltyCards
	fi
done

#npx patch-package hafas-client
