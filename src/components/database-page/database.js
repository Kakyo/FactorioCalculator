define(['knockout', 'text!./database.html', 'jquery',
    'text!/data/raw/recipes/ammo.lua', 'text!/data/raw/recipes/capsule.lua', 'text!/data/raw/recipes/demo-furnace-recipe.lua',
    'text!/data/raw/recipes/demo-recipe.lua', 'text!/data/raw/recipes/demo-turret.lua', 'text!/data/raw/recipes/equipment.lua',
    'text!/data/raw/recipes/fluid-recipe.lua', 'text!/data/raw/recipes/furnace-recipe.lua', 'text!/data/raw/recipes/inserter.lua',
    'text!/data/raw/recipes/module.lua', 'text!/data/raw/recipes/recipe.lua', 'text!/data/raw/recipes/turret.lua'
], function(ko, template, $) {

    var luaFiles = Array.prototype.slice.apply(arguments, [3]);

    function DatabaseViewModel(route) {
        this.file_content = ko.observable();
        this.collection = ko.observable();

        for (var fileIndex in luaFiles) {
            var file = luaFiles[fileIndex];
            this.parseData(file);
        }
        debugger;
    }

    function luaToJson(lua) {
        var diff;
        do { // replace curlies around arrays with square brackets
            diff = lua.length;
            lua = lua.replace(/\{(((\n\t*)\t)\S.*(\2.*)*)\,\s--\s\[\d+\]\3\}/g, '[$1$3]');
            diff = diff - lua.length;
        } while (diff > 0);
        //debugger;
        lua = lua.replace(/\s--\s\[\d+\](\n)/g, '$1'); // remove comment
        lua = lua.replace(/[\s\t\r\n]/g, ''); // remove tabs & returns
        lua = lua.replace(/\,(\})/g, '$1'); // remove trailing comma
        lua = lua.replace(/,"requester_paste_multiplier":\d*/g, '');
        lua = lua.replace(/([\,\{\[])(\w*)=/g, '$1"$2":'); // change equal to semicolon and add quotes to properties
        lua = lua.replace(/^data:extend\({/, '['); //  remove function notation
        lua = lua.replace(/}\)$/, ']') //  remove function notation
        lua = lua.replace(/{{/g, '[{').replace(/(\d)}}/g, '$1}]'); //  change dictionaries to arrays
        lua = lua.replace(/"\,(\d+)/gi, "\":$1");;
        console.log(lua);
        return JSON.parse(lua);
    }

    var building_map = {
        'crafting-with-fluid': ['assembling-machine-3', 'assembling-machine-2'],
        'rocket-building': ['rocket-silo'],
        'crafting': ['assembling-machine-3', 'assembling-machine-2', 'assembling-machine-1'],
        'chemistry': ['chemical-plant'],
        'oil-processing': ['oil-refinery'],
        'smelting': ['electric-furnace', 'steel-furnace', 'stone-furnace']
    }
    var intermediate_products = {
        'wood': 1,
        'iron-plate': 1,
        'copper-plate': 1,
        'steel-plate': 1,
        'stone-brick': 1,
        'sulfur': 1,
        'plastic-bar': 1,
        'battery': 1,
        'iron-stick': 1,
        'iron-gear-wheel': 1,
        'copper-cable': 1,
        'eletronic-circuit': 1,
        'advanced-circuit': 1,
        'processing-unit': 1,
        'engine-unit': 1,
        'flying-robot-frame': 1,
        'science-pack-1': 1,
        'science-pack-2': 1,
        'science-pack-3': 1,
        'military-science-pack': 1,
        'production-science-pack': 1,
        'high-tech-science-pack': 1,
        'space-science-pack': 1,
        'empty-barrel': 1,
        'explosives': 1
    };

    DatabaseViewModel.prototype.parseData = function(file) {
        var text = luaToJson(file || this.file_content());
        var data = eval(text);

        var result = [];
        //debugger;
        for (var i = 0, len = data.length; i < len; i++) {
            var dataitem = data[i];
            if(!!dataitem.normal){
                result.push({
                    id: dataitem.name,
                    building: building_map[dataitem.category] || building_map["crafting"],
                    accept_productivity: !!intermediate_products[dataitem.name],
                    normal: parseDifficulty(dataitem.normal),
                    expensive: parseDifficulty(dataitem.expensive)
                });
            } else {
                result.push($.extend({
                        id: dataitem.name,
                        building: building_map[dataitem.category] || building_map["crafting"],
                        accept_productivity: !!intermediate_products[dataitem.name]
                    }                    
                    ,parseDifficulty(dataitem)
                ));
            }
        }

        //debugger;
        var existing = JSON.parse(this.collection() || "[]");
        Array.prototype.push.apply(existing, result);
        this.collection(JSON.stringify(existing));
    }

    function parseDifficulty(item){
        return {
            time: item.energy_required || 0.5,
            input: parseIngredients(item.ingredients),
            output: parseIngredients(item.result || item.results, item.result_count)
        }
    }

    function parseIngredients(ingredients, item_count) {
        var result = {};
        var index = 0;
        var item = {};
        var length = 0;

        //  static single ingredient with amount in sibling property (sent through parameter)
        if (typeof(ingredients) === "string") {
            result[ingredients] = item_count || 1;
        }
        else if (ingredients.length > 0) {
            for (index = 0, length = ingredients.length; index < length; index++) {
                item = ingredients[index];
                //  name/value objects inside an array
                if (typeof(item.name) !== "undefined") {
                    result[item.name] = item.amount || 1;
                }
                else if (typeof(item) === "object") {
                    item = Object.keys(ingredients[index]);

                    for (var nestIndex = 0, nestLength = item.length; nestIndex < nestLength; nestIndex++) {
                        var nestedItem = ingredients[index][item[nestIndex]];
                        result[item[nestIndex]] = nestedItem || 1;
                    }
                }
                else {
                    $.extend(result, item);
                }
            }
        }
        return result;
    }


    return {
        viewModel: DatabaseViewModel,
        template: template
    };


});
