define(['knockout', 'text!./production-row.html', 'data', 'app/formulae', 'i18n', 'app/recipes'], function(ko, template, $d, $f, $i, $r) {

    function ProductionRowViewModel(params) {
        var $self = this;
        $self.recipe = params.recipe;
        $self.building = {
            selected: params.building,
            available: params.recipe.building
        };
        $self.building.available.observe = function(newBuildingId) {
            var building = $d.buildings.get(newBuildingId)
            $self.building.selected(building);
        };
        $self.module = params.module;
        $self.children = params.children;
        $self.expensiveRecipes = params.expensiveRecipes;
        $self.inputProduction = {};
        $self.header = $i(params.recipe.id)||params.recipe.id;
        $self.supply = ko.observable();
        
        $self.enableProductivity = !!params.recipe.accept_productivity;

        $self.options = {
            calculateCycle: params.calculateCycle,
            cycleLength: params.cycleLength,
            calculateBuildings: params.calculateBuildings,
            //  remove dependency from global numberOfBuildings
            numberOfBuildings: ko.observable(typeof(params.numberOfBuildings) === "function" ? params.numberOfBuildings() : params.numberOfBuildings),

            visible: ko.computed(() => {
                return params.visible() && params.visibleParent()
            }),
            visibleParent: params.visibleParent,
            hasInputs: ko.computed(() => Object.keys($r.GetRecipeInput($self.recipe, $self.expensiveRecipes()) || {}).length > 0),
            hasSupply: ko.computed(() => Object.keys($self.supply() || {}).length > 0),
            hasChildren: ko.computed(() => $self.children().length > 0),

            showChildren: ko.observable(false),
            showEditModule: ko.observable(false),
            showRecipeDetails: ko.observable(false),
        }
        $self.options.showChildrenIcon = ko.computed(showIconFn($self.options.showChildren, 'glyphicon-chevron-', 'down', 'right'));
        $self.options.showRecipeDetailsIcon = ko.computed(showIconFn($self.options.showRecipeDetails, 'glyphicon-eye-', 'close', 'open'));

        $self.options.supplyIcon = ko.computed(() => {
            var result = 'glyphicon glyphicon-';
            var enoughInput = $self.options.hasSupply.peek();
            var supply = $self.supply();
            if (enoughInput) {
                Object.each(supply, item => (enoughInput = enoughInput && item >= 1.0));
                result += (enoughInput ? 'ok' : 'remove');
            }
            else {
                result += 'remove';
            }
            return result + '-circle';
        });
        $self.options.supplyTooltip = ko.computed(() => {
            var text = ["Supply summary "];
            Object.each($self.supply(), (value, name) => {
                text.push($i(name) + ': ' + (value * 100).toFixed(0) + "%");
            });
            return text.join('\n');
        });

        $self.stats = {
            input: ko.computed($self.computeInput()),
            output: ko.computed($self.computeOutput()),
            building: ko.computed($self.computeBuilding())
        }

        $self.removeRecipeFromParentClick = params.removeRecipeClick;
        $self.includeChildrenClick = params.includeChildrenClick;
        $self.removeRecipeClick = $self.removeRecipeFn();

        $self.headerSizes = $self.stats.output.peek().length > 1 ? {
            breaker: 'hidden-lg hidden-md',
            recipe: 'col-xs-12 col-sm-6 col-md-5',
            building: 'col-xs-12 col-sm-3 col-md-3',
            output: 'col-xs-10 col-sm-7 col-md-10'
        } : {
            breaker: 'hidden-lg hidden-md',
            recipe: 'col-xs-12 col-sm-6 col-md-3',
            building: 'col-xs-12 col-sm-3 col-md-2',
            output: 'col-xs-10 col-sm-7 col-md-2'
        }

        if (params.parentViewModel) {
            params.parentViewModel.register($self);
        }
    }

    function toggleOption(observableOption) {
        observableOption(!observableOption.peek());
    }

    function showIconFn(toggleObservable, iconBaseName, displayName, hideName) {
        return () => iconBaseName + (toggleObservable() ? displayName : hideName);
    }

    function _removeRecipeFromChildren(recipeToRemove, context) {
        var recipes = context.children.peek();
        for (var r in recipes) {
            if (recipes[r].recipe.id === recipeToRemove.recipe.id) {
                context.children.remove(recipes[r]);
                break;
            }
        }
    }

    function _extractNameValueMap(array) {
        var dictionary = {};

        ko.utils.arrayForEach(array, function(item) {
            dictionary[item.name] = item.value;
        });

        return dictionary;
    }

    function _setProduction(parentInputs, childOutputs) {
        Object.each(parentInputs, function(value, key) {
            for (var c = 0; c < childOutputs.length; c++) {
                if (childOutputs[c].name == key) {
                    childOutputs[c].value(value);
                    break;
                }
            }
        })
    }

    ProductionRowViewModel.prototype.removeRecipeFn = function() {
        var $self = this;
        return recipeViewModel => $self.children().length == 0 || $self.recipe.id == recipeViewModel.recipe.id ?
            $self.removeRecipeFromParentClick(recipeViewModel) :
            _removeRecipeFromChildren(recipeViewModel, $self);
    }

    ProductionRowViewModel.prototype.computeInput = function() {
        var $self = this;
        return () => {
            var result = [];
            var cycleLength = $self.options.cycleLength();
            var numberOfBuildings = $self.options.numberOfBuildings();

            var inputs = $f.GetInputPerSecond($self.recipe, $self.building.selected, $f.GetSpeedMultiplier($self.module), $self.expensiveRecipes);
            var length = Object.keys(inputs).length;
            var size = 'col-lg-' + Math.round(12 / length) + ' col-sm-' + Math.round(24 / length);

            for (var k in inputs) {
                result.push({
                    name: k,
                    size: size,
                    value: (inputs[k] * cycleLength * numberOfBuildings).toFixed(4)
                });
            }

            return result;
        }
    }

    ProductionRowViewModel.prototype.computeOutput = function() {
        var $self = this;
        return () => {
            var result = [];
            var cycleLength = $self.options.cycleLength();
            var numberOfBuildings = $self.options.numberOfBuildings();

            var inputs = $f.GetOutputPerSecond($self.recipe, $self.building.selected, $f.GetSpeedMultiplier($self.module), $f.GetProductionMultiplier($self.module), $self.expensiveRecipes);
            var size = 'col-sm-' + Math.round(12 / Object.keys(inputs).length);
            for (var k in inputs) {
                result.push({
                    name: k,
                    size: size,
                    value: ko.computed({
                        read: function() {
                            return (inputs[this] * cycleLength * numberOfBuildings).toFixed(4);
                        },
                        write: function(desiredValue) {
                            var value = $f.GetNumberOfBuildings(desiredValue, inputs[this], cycleLength);
                            if (value !== numberOfBuildings) {
                                $self.options.numberOfBuildings(value.toFixed(4));
                            }
                        },
                        owner: null
                    }, k)
                });
            }

            return result;
        }
    }

    ProductionRowViewModel.prototype.computeBuilding = function() {
        var $self = this;
        return () => {
            var result = [{
                name: "speed",
                icon: 'glyphicon-forward',
                value: 0
            }, {
                name: "Pollution",
                icon: 'glyphicon-cloud',
                value: 0
            }, {
                name: "Energy",
                icon: 'glyphicon-flash',
                value: 0
            }]

            //  observes
            var building = $self.building.selected();

            if (building) {
                //  multipliers
                var speedMultiplier = $f.GetSpeedMultiplier($self.module);
                var pollutionMultiplier = $f.GetPollutionMultiplier($self.module);
                var energyMultiplier = $f.GetEnergyMultiplier($self.module);

                var cycleLength = $self.options.calculateCycle() ? $self.options.cycleLength() : 1;
                var numberOfBuildings = $self.options.calculateBuildings() ? $self.options.numberOfBuildings() : 1;

                //  totals
                result[0].value = Math.round(building.speed * (1 + speedMultiplier) * 100) / 100;
                result[1].value = Math.round(building.pollution * (1 + pollutionMultiplier) * cycleLength * numberOfBuildings * 100) / 100;
                result[2].value = Math.round(building.energy.max * (1 + energyMultiplier) * cycleLength * numberOfBuildings * 100) / 100;
            }
            result[0].value += 'x';
            result[1].value += ' pu';
            result[2].value += ' kw';
            return result;
        }
    }

    ProductionRowViewModel.prototype.computeSupply = function() {
        var $self = this;
        var children = $self.children.peek();

        if (children.length > 0) {
            var childrenProduction = {};
            Object.each($self.inputProduction, function(prop) {
                var childProduction = _extractNameValueMap(prop.peek());
                Object.merge(childrenProduction, childProduction);
            });

            var supply = {};
            Object.each(_extractNameValueMap($self.stats.input.peek()), function(input, key) {
                var output = childrenProduction[key].peek();
                supply[key] = output / input;
            });

            $self.supply(supply);
        }
    }

    ProductionRowViewModel.prototype.showChildrenClick = function() {
        toggleOption(this.options.showChildren);
    }

    ProductionRowViewModel.prototype.showRecipeDetailsClick = function() {
        toggleOption(this.options.showRecipeDetails);
    }

    ProductionRowViewModel.prototype.editModules = function() {
        var $self = this;
        $self.options.showEditModule(!$self.options.showEditModule.peek());
    }

    ProductionRowViewModel.prototype.register = function(childProductionViewModel) {
        var childRecipeId = childProductionViewModel.recipe.id;
        this.inputProduction[childRecipeId] = childProductionViewModel.stats.output;

        var recipeInputs = _extractNameValueMap(this.stats.input.peek());
        _setProduction(recipeInputs, this.inputProduction[childRecipeId].peek());

        var bind = this.computeSupply.bind(this);
        this.stats.output.subscribe(bind);
        childProductionViewModel.stats.output.subscribe(bind);
    }

    return {
        viewModel: ProductionRowViewModel,
        template: template
    };
});
