define(['knockout', 'text!./selection-recipe.html', 'data', 'app/formulae', 'app/recipes'], function(ko, template, dataLoader, $f, $r) {

    var MAX_SIZE = 12;

    function SelectionRecipe(params) {
        var $self = this;
        $self.selectedRecipe = params.selectedRecipe;
        $self.selectedModules = params.selectedModules;
        $self.expensiveRecipes = params.expensiveRecipes;
        $self.availableRecipes = dataLoader.recipes.available;

        $self.input = ko.computed(function() {
            var selectedRecipe = $self.selectedRecipe();
            if (!!selectedRecipe) {
                return $r.GetRecipeInput(selectedRecipe, $self.expensiveRecipes());
            } else {
                return {};
            }
        });

        $self.time = ko.computed(function() {
            var selectedRecipe = $self.selectedRecipe();
            if (!!selectedRecipe) {
                return $r.GetRecipeTime(selectedRecipe, $self.expensiveRecipes());
            } else {
                return {};
            }
        });

        $self.output = ko.computed(function() {
            var selectedRecipe = $self.selectedRecipe();
            if (!!selectedRecipe) {
                return $r.GetRecipeOutput(selectedRecipe, $self.expensiveRecipes());
            } else {
                return {};
            }
        });

        $self.inputSize = ko.computed(function() {
            var selectedRecipe = $self.selectedRecipe();
            var size = 0;
            var length = 0;
            if (!!selectedRecipe) {
                length = Object.keys($r.GetRecipeInput(selectedRecipe, $self.expensiveRecipes())).length;
                size = Math.floor(MAX_SIZE / length);
            }
            return "col-sm-" + (length > 4 ? size * 2 : size) + " col-lg-" + size;
        });
        $self.outputSize = ko.computed(function() {
            var selectedRecipe = $self.selectedRecipe();
            var size = 0;
            if (!!selectedRecipe) {
                size = Math.floor(MAX_SIZE / Object.keys($r.GetRecipeOutput(selectedRecipe, $self.expensiveRecipes())).length);
            }
            return "col-sm-" + (length > 4 ? size * 2 : size) + " col-lg-" + size;
        });
        $self.outputText = ko.computed(function() {

            var text = '';

            var multiplier = Math.round($f.GetProductionMultiplier(this.selectedModules) * 100);
            if (multiplier != 0) {
                text += " ( " + (multiplier > 0 ? '+' : '') + multiplier + "% )";
            }

            return text;

        }, $self);
    }

    return {
        viewModel: SelectionRecipe,
        template: template
    };
});
