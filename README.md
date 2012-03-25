FunkyBuild
==========

NOTE: This software is just in the very early stages of development. Feel free to tag along, try it out, experiment, or fork and contribute. Please don't expect any production-ready features in the foreseeable future.

FunkyBuild vision
-----------------

FunkyBuild is aimed to be a functionally oriented, asynchronous, distributed, configurable, easy-to-use build system. 
This is in contrast to all the side-effects based build systems out there, such as maven, ant, buildr, gradle, and more. 
Part of the vision is to have a single build system that scales from a single project to a continuous integration system of any size.

Technically speaking
--------------------

Technically, FunkyBuild will be implemented in JavaScript and built on the NodeJS platform. 
The reason is that JavaScript is a very nice language that most developers today get in contact with, be it python-, Java-, .NET-, Groovy-, Ruby-, or other developers. 
In addition, the NodeJS platform has built in support for efficient asynchronous and distributed computing.

Architectural idea
------------------

The architectural idea (which admittedly is very coarse at the moment) is to build asynchronous /funklets/ that perform build steps. 
Every funklet takes a few named inputs, and provides one named output.
These funklets can be combined in a unidirectional graph where inputs and outputs are declaratively chained. 
The graph is resolved by FunkyBuild, and the build is performed asynchronously as new inputs are available for the next build steps.

Unlike side effects based build systems, this allows for seamless parallelization and distribution of computations.

NOTE: Exactly how to declare the graph in a user friendly way and how to do this for multi-projects is unclear at the moment.


Roadmap
-------

Initially, the focus will be on building Java-projects. This should provide sufficient challenges to get the basic build and dependency mechanisms in place, as well as an idea on how to structure the code. 

After that, more languages, polyglotting projects, visualizing builds, distributed builds, making FunkyBuild a CI server, total world domination, making FunkyBuild user friendly (not necessarily in that order).

As you understand, there are loads of things to do:

- Internalize asynch mechanism (a.t.m. asyncjs)
- Using libraries
	- Local
	- Maven
- Multi project support






