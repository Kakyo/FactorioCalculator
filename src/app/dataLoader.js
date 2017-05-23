define(['knockout', 'jquery', 'app/LoadManager'], function(ko, $, Manager) {

    var BASE_URL = '../data/{0}.json';

    function handleRecipeResult(manager, recipes, baseMapping) {
        baseMapping(manager, recipes);

        manager.mapOutput = {};
        for (var r = 0, lenR = recipes.length; r < lenR; r++) {

            var recipeOutput = Object.keys(!!recipes[r].output ? recipes[r].output : recipes[r].normal.output);
            for (var o = 0, lenO = recipeOutput.length; o < lenO; o++) {
                var output = recipeOutput[o];
                if (!manager.mapOutput[output]) {
                    manager.mapOutput[output] = [];
                }
                manager.mapOutput[output].push(recipes[r]);
            }
        }
    }

    var Locales = new Manager(BASE_URL.replace('{0}', 'locales'), true);
    Locales.selected('en');

    function getRecipeUrl() {
        var version = getQueryVariable('v');
        var url = 'recipes' + (version ? '' : '.v15');

        return BASE_URL.replace('{0}', url);
    }
    
    var Recipes = new Manager(getRecipeUrl(), handleRecipeResult, 'i18n');
    Recipes.getByOutput = function(id) {
        return this.mapOutput[id]
    }

    var Buildings = new Manager(BASE_URL.replace('{0}', 'buildings'), true);

    var Config = new Manager(BASE_URL.replace('{0}', 'configuration'), false);

    var availableModules = {
        speed: {
            level1: ko.observable(0),
            level2: ko.observable(0),
            level3: ko.observable(0)
        },
        production: {
            level1: ko.observable(0),
            level2: ko.observable(0),
            level3: ko.observable(0)
        },
        efficiency: {
            level1: ko.observable(0),
            level2: ko.observable(0),
            level3: ko.observable(0)
        },
        clone: function(keepDependency) {
            return {
                speed: {
                    level1: keepDependency ? availableModules.speed.level1 : ko.observable(availableModules.speed.level1.peek()),
                    level2: keepDependency ? availableModules.speed.level2 : ko.observable(availableModules.speed.level2.peek()),
                    level3: keepDependency ? availableModules.speed.level3() : ko.observable(availableModules.speed.level3.peek())
                },
                production: {
                    level1: keepDependency ? availableModules.production.level1 : ko.observable(availableModules.production.level1.peek()),
                    level2: keepDependency ? availableModules.production.level2 : ko.observable(availableModules.production.level2.peek()),
                    level3: keepDependency ? availableModules.production.level3 : ko.observable(availableModules.production.level3.peek())
                },
                efficiency: {
                    level1: keepDependency ? availableModules.efficiency.level1 : ko.observable(availableModules.efficiency.level1.peek()),
                    level2: keepDependency ? availableModules.efficiency.level2 : ko.observable(availableModules.efficiency.level2.peek()),
                    level3: keepDependency ? availableModules.efficiency.level3 : ko.observable(availableModules.efficiency.level3.peek())
                }
            };
        },
        init: function(watch) {
            return {
                speed: {
                    level1: watch ? ko.observable(0) : 0,
                    level2: watch ? ko.observable(0) : 0,
                    level3: watch ? ko.observable(0) : 0
                },
                production: {
                    level1: watch ? ko.observable(0) : 0,
                    level2: watch ? ko.observable(0) : 0,
                    level3: watch ? ko.observable(0) : 0
                },
                efficiency: {
                    level1: watch ? ko.observable(0) : 0,
                    level2: watch ? ko.observable(0) : 0,
                    level3: watch ? ko.observable(0) : 0
                }
            };
        }
    }

    return {
        recipes: Recipes,
        buildings: Buildings,
        locales: Locales,
        config: Config,
        modules: availableModules
    }
})
