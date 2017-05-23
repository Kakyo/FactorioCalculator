define(['knockout', 'text!./statistic-view.html', 'app/formulae'], function(ko, markupTemplate, $f) {

    function createResult() {
        var result = [];
        for (var a in arguments) {
            result.push({
                name: arguments[a],
                icon: getIconName(arguments[a]),
                value: 0
            });
        }
        return result;
    }

    function StatisticView(params) {
        var $self = this;

        $self.calculateCycle = params.calculateCycle;
        $self.calculateBuildings = params.calculateBuildings;
        $self.expensiveRecipes = params.expensiveRecipes;
        $self.buildingProperties = ko.computed($self.computeBuilding(params));
        $self.inputProperties = ko.computed($self.computeInput(params));
        $self.outputProperties = ko.computed($self.computeOutput(params));
    }

    function getIconName(name) {
        var icon = "glyphicon-";
        switch (name.toLowerCase()) {
            case 'speed':
                icon += 'forward';
                break;
            case 'pollution':
                icon += 'cloud';
                break;
            case 'energy':
                icon += 'flash';
                break;
            default:
                icon += name;
                break;
        }
        return icon;
    }

    StatisticView.prototype.computeBuilding = function(params) {
        return function() {
            var result = createResult('Speed', 'Pollution', 'Energy');

            //  observes
            var building = params.selectedBuilding();

            if (building) {
                //  multipliers
                var speedMultiplier = $f.GetSpeedMultiplier(params.selectedModules);
                var pollutionMultiplier = $f.GetPollutionMultiplier(params.selectedModules);
                var energyMultiplier = $f.GetEnergyMultiplier(params.selectedModules);

                var cycleLength = params.calculateCycle() ? params.cycleLength() : 1;
                var numberOfBuildings = params.calculateBuildings() ? params.numberOfBuildings() : 1;

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
    StatisticView.prototype.computeInput = function(params) {
        return function() {
            var result = [];
            var cycleLength = params.calculateCycle() ? params.cycleLength() : 1;
            var numberOfBuildings = params.calculateBuildings() ? params.numberOfBuildings() : 1;

            var inputs = $f.GetInputPerSecond(params.selectedRecipe, params.selectedBuilding, $f.GetSpeedMultiplier(params.selectedModules), params.expensiveRecipes);
            for (var k in inputs) {
                result.push({
                    name: k,
                    value: (inputs[k] * cycleLength * numberOfBuildings).toFixed(4)
                });
            }

            return result;
        }
    }
    StatisticView.prototype.computeOutput = function(params) {
        return function() {
            var result = [];
            var cycleLength = params.calculateCycle() ? params.cycleLength() : 1;
            var numberOfBuildings = params.calculateBuildings() ? params.numberOfBuildings() : 1;

            var inputs = $f.GetOutputPerSecond(params.selectedRecipe, params.selectedBuilding, $f.GetSpeedMultiplier(params.selectedModules), $f.GetProductionMultiplier(params.selectedModules), params.expensiveRecipes);
            for (var k in inputs) {
                result.push({
                    name: k,
                    value: ko.computed({
                        read: function() {
                            return (inputs[this] * cycleLength * numberOfBuildings).toFixed(4);
                        },
                        write: function(desiredValue) {
                            var value = $f.GetNumberOfBuildings(desiredValue, inputs[this], cycleLength);
                            if (value !== numberOfBuildings) {
                                params.numberOfBuildings(value.toFixed(4));
                            }
                        },
                        owner: null
                    }, k)
                });
            }

            return result;
        }
    }


    return {
        viewModel: StatisticView,
        template: markupTemplate
    };
});
