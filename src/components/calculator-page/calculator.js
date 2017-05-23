define(['knockout', 'text!./calculator.html', 'data', 'app/recipes', /*pre-load*/ 'components/production/production-row'], function(ko, template, dataLoader, $r) {

    function CalculatorViewModel(route) {
        var $self = this;
        
        $self.isV15 = !getQueryVariable('v');

        $self.calculateBuildings = ko.observable(true);
        $self.calculateCycle = ko.observable(true);
        $self.cycleLength = ko.observable(1);
        $self.numberOfBuildings = ko.observable(1);

        $self.expensiveRecipes = ko.observable(false);
        $self.selectedRecipe = ko.observable();
        $self.selectedBuilding = ko.observable();
        $self.selectedModules = dataLoader.modules;
        $self.recipeTree = ko.observableArray([]);

        $self.isOpen = ko.observable(true);
        $self.toggleIcon = ko.pureComputed(function() {
            return "glyphicon-chevron-" + ($self.isOpen() ? "up" : 'down');
        });
    }

    CalculatorViewModel.prototype.addRecipe = function() {
        var $self = this;

        var recipe = $self.selectedRecipe.peek();
        $self.recipeTree.push({
            recipe: recipe,
            availableRecipes: [recipe],
            building: ko.observable($self.selectedBuilding.peek()),
            availableBuildings: recipe.building,
            module: $self.selectedModules.clone(0),
            children: ko.observableArray() //_loadInputs(20, recipe)
        });
    }

    CalculatorViewModel.prototype.removeRecipe = function() {
        var $self = this;
        return recipeViewModel => {
            var recipes = $self.recipeTree.peek();
            for (var r in recipes) {
                if (recipes[r].recipe.id === recipeViewModel.recipe.id) {
                    $self.recipeTree.remove(recipes[r]);
                    break;
                }
            }
        };
    }

    CalculatorViewModel.prototype.includeChildren = function() {
        var $self = this;
        return recipeViewModel => {

            var inputs = _loadInputs(1, recipeViewModel.recipe, $self.expensiveRecipes());
            var children = recipeViewModel.children.peek();

            for (var i in inputs) {
                for (var c in children) {
                    if (inputs[i].recipe.id === children[c].recipe.id) {
                        inputs.splice(i, 1);
                    }
                }
            }

            if (inputs.length > 0) {
                recipeViewModel.children.pushAll(inputs);
                recipeViewModel.options.showChildren(true);
            }
            setTimeout(recipeViewModel.computeSupply.bind(recipeViewModel), 100);
        }
    }
    CalculatorViewModel.prototype.toggleClick = function() {
        this.isOpen(!this.isOpen());
    }

    function _loadInputs(length, recipe, expensiveRecipes) {
        var result = [];
        if (length > 0) {
            for (var i = 0, keys = Object.keys($r.GetRecipeInput(recipe, expensiveRecipes)); i < keys.length; i++) {
                var input = keys[i];

                var recipeByOutput = dataLoader.recipes.getByOutput(input);
                if (!recipeByOutput || !recipeByOutput.length) {
                    continue;
                };
                var selectedRecipe = recipeByOutput[0];

                result.push({
                    recipe: selectedRecipe,
                    availableRecipes: recipeByOutput,
                    building: ko.observable(dataLoader.buildings.get(selectedRecipe.building[0])),
                    availableBuildings: selectedRecipe.building,
                    module: dataLoader.modules.init(1),
                    children: ko.observableArray(_loadInputs(length - 1, selectedRecipe) || [])
                });
            }
        }
        return result;
    }

    return {
        viewModel: CalculatorViewModel,
        template: template
    };
});
