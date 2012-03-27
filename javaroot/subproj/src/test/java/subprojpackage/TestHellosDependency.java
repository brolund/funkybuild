package subprojpackage;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class TestHellosDependency {

	@Test
	public void testHello() {		
		assertEquals("Hello, node world!", new HellosDependency().g);
	} 

}