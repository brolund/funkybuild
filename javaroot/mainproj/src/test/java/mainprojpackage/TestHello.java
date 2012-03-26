package mainprojpackage;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class TestHello {

	@Test
	public void testHello() {		
		assertEquals("Dependency says: Hello, node world!", new Hello().g);
	} 

}