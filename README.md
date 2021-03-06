FunkyBuild
==========

NOTE: This software is just in the very early stages of development. Feel free to tag along, try it out, experiment, or fork and contribute. Please don't expect any production-ready features in the foreseeable future.

FunkyBuild vision
-----------------

FunkyBuild is aimed to be a functionally oriented, asynchronous, distributed, configurable, extensible, easy-to-use build system. The goal is to have a single build system that seamlessly scales from a single project to a continuous integration system of any size.

The functional, distributed and asynchronous aspects are in contrast to all the side-effects based build systems out there, such as maven, ant, buildr, gradle, and more. The configurable, extensible and easy to use aspects are in contrast to some of them.

Technically speaking
--------------------

Technically, FunkyBuild will be implemented in JavaScript and built on the NodeJS platform. 
The reason is that JavaScript is a very nice language that most developers today get in contact with, be it python-, Java-, .NET-, Groovy-, Ruby-, or other developers. 

In addition, the NodeJS platform has built in support for efficient asynchronous and distributed computing.

Architectural idea
------------------

The architectural idea (which admittedly is very coarse at the moment) is to build asynchronous /funklets/ that perform build steps. 
Every funklet takes a few named inputs, and provides one named output.
These funklets can be combined in a unidirectional graph where inputs and outputs are implicitly chained. 
The graph is resolved by FunkyBuild, and the build is performed asynchronously as new inputs are available for the next build steps.

Unlike side effects based build systems, this allows for seamless parallelization and distribution of computations.

FunkyBuild will be able to make use of any existing command line tools, but even though these tools are side-effect tools, the funklets must always wrap that in a functional manner. An example is Java compilation, which writes files to disk. The javac funklet must then wrap this in a return value that can be used by the next funklets.

NOTE: Exactly how to declare the graph in a user friendly way and how to do this for multi-projects is unclear at the moment.


Roadmap
-------

Initially, the focus will be on building Java-projects. This should provide sufficient challenges to get the basic build and dependency mechanisms in place, as well as an idea on how to structure the code. 

After that, more languages, polyglotting projects, visualizing builds, distributed builds, making FunkyBuild a CI server, total world domination, making FunkyBuild user friendly (not necessarily in that order).

As you understand, there are loads of things to do:

- Internalize asynch mechanism (a.t.m. asyncjs)
- Using libraries
	- Locally stored libraries
	- Maven integration
	- Ivy integration
- Multi (Java) project support
- Create mechanism for async execution that allows for 'fat' declaration, but only execute selected outputs (i.e. replace async)
- Build output
	- err/out
	- Keeping track of what is being built
- Version control integration
	- Git
	- SVN
	- Mercurial
- Visualization of the build process
- Seamless distribution
- Building a CI server on top of FunkyBuild
	- Web server for build status
	- Live visualization of build progress




