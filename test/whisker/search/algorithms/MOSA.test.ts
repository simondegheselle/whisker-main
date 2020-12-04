/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */

import {BitstringChromosomeGenerator} from "../../../../src/whisker/bitstring/BitstringChromosomeGenerator";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {MOSA} from "../../../../src/whisker/search/algorithms/MOSA";
import {FitnessFunction} from "../../../../src/whisker/search/FitnessFunction";
import {BitstringChromosome} from "../../../../src/whisker/bitstring/BitstringChromosome";
import {SingleBitFitnessFunction} from "../../../../src/whisker/bitstring/SingleBitFitnessFunction";
import {List} from "../../../../src/whisker/utils/List";
import {RankSelection} from "../../../../src/whisker/search/operators/RankSelection";
import {BitflipMutation} from "../../../../src/whisker/bitstring/BitflipMutation";
import {SinglePointCrossover} from "../../../../src/whisker/search/operators/SinglePointCrossover";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {SearchAlgorithmType} from "../../../../src/whisker/search/algorithms/SearchAlgorithmType";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {Container} from "../../../../src/whisker/utils/Container";
import {VMWrapperMock} from "../../utils/VMWrapperMock";
import {OptimalSolutionStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";

describe('MOSA', () => {

    let searchAlgorithm;

    const populationSize = 50;
    const chromosomeLength = 10;
    const crossoverProbability = 1;
    const mutationProbability = 1;
    const maxIterations = 100;



    beforeEach(() => {
        const mock = new VMWrapperMock();
        mock.init()
        Container.vmWrapper = mock;

        const builder: SearchAlgorithmBuilder<BitstringChromosome> = new SearchAlgorithmBuilder(SearchAlgorithmType.MOSA);

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        properties.setMutationProbablity(mutationProbability);
        properties.setCrossoverProbability(crossoverProbability);
        properties.setStoppingCondition(new OneOfStoppingCondition(new FixedIterationsStoppingCondition(maxIterations), new OptimalSolutionStoppingCondition()));

        builder
            .addProperties(properties)
            .addChromosomeGenerator(new BitstringChromosomeGenerator(properties,
                new BitflipMutation(), new SinglePointCrossover()))
            .addSelectionOperator(new RankSelection())
            .initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, chromosomeLength, new List());

        searchAlgorithm = builder.buildSearchAlgorithm();
    });

    test('BitstringChromosome with SingleBitFitnessFunction', async () => {
        const solutions = await searchAlgorithm.findSolution() as List<BitstringChromosome>;
        expect(solutions === searchAlgorithm.getCurrentSolution()).toBeTruthy();

        const fitnessFunctions = searchAlgorithm["_fitnessFunctions"];
        for (const fitnessFunction of fitnessFunctions.values()) {
            let optimal = false;
            for (const solution of solutions) {
                if (fitnessFunction.isOptimal(await fitnessFunction.getFitness(solution))) {
                    optimal = true;
                    break;
                }
            }
            expect(optimal).toBeTruthy();
        }
    });

    test('Get current solution', async () => {
        expect(searchAlgorithm.getCurrentSolution()).toEqual(new List<BitstringChromosome>());
        const solutions = await searchAlgorithm.findSolution() as List<BitstringChromosome>;
        expect(searchAlgorithm.getCurrentSolution()).toEqual(solutions);
    });

    test('Get number of iterations', async () => {
        expect(searchAlgorithm.getNumberOfIterations()).toEqual(0);
        await searchAlgorithm.findSolution();
        expect(searchAlgorithm.getNumberOfIterations()).toBeGreaterThan(0);
        expect(searchAlgorithm.getNumberOfIterations()).toBeLessThanOrEqual(maxIterations);
    });

    test('Setter', () => {

        const properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        properties.setCrossoverProbability(crossoverProbability);
        properties.setMutationProbablity(mutationProbability);
        const stoppingCondition = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(maxIterations), new OptimalSolutionStoppingCondition());
        properties.setStoppingCondition(stoppingCondition);

        const fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        for (let i = 0; i < chromosomeLength; i++) {
            fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
        }
        const chromosomeGenerator = new BitstringChromosomeGenerator(properties, new BitflipMutation(), new SinglePointCrossover());
        const selectionOp = new RankSelection();

        const searchAlgorithm = new MOSA();
        searchAlgorithm.setProperties(properties);
        expect(searchAlgorithm["_properties"]).toBe(properties);
        expect(searchAlgorithm["_stoppingCondition"]).toBe(stoppingCondition);

        searchAlgorithm.setChromosomeGenerator(chromosomeGenerator);
        expect(searchAlgorithm["_chromosomeGenerator"]).toBe(chromosomeGenerator);

        searchAlgorithm.setFitnessFunctions(fitnessFunctions);
        expect(searchAlgorithm["_fitnessFunctions"]).toBe(fitnessFunctions);

        searchAlgorithm.setSelectionOperator(selectionOp);
        expect(searchAlgorithm["_selectionOperator"]).toBe(selectionOp);
    });

    test("Not supported setter", () => {
        const searchAlgorithm: MOSA<BitstringChromosome> = new MOSA();
        expect(function() {
            searchAlgorithm.setFitnessFunction(null);
        }).toThrow();
    });
});
