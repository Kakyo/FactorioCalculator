define(['knockout', 'text!./production-table.html'], function(ko, template) {

    function ProductionTableViewModel(params) {
        var $self = this;
        $self.recipeTree = params.recipeTree;
        $self.calculateCycle = params.calculateCycle;
        $self.cycleLength = params.cycleLength;
        $self.calculateBuildings = params.calculateBuildings;
        $self.numberOfBuildings = params.numberOfBuildings;
        $self.removeRecipeClick = params.removeRecipeClick;
        $self.includeChildrenClick = params.includeChildrenClick;
        $self.expensiveRecipes = params.expensiveRecipes;
    }


    return {
        viewModel: ProductionTableViewModel,
        template: template
    };
});
