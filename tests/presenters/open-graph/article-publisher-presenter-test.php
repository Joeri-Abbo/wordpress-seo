<?php

namespace Yoast\WP\Free\Tests\Presenters;

use Brain\Monkey;
use Yoast\WP\Free\Presentations\Indexable_Presentation;
use Yoast\WP\Free\Presenters\Open_Graph\Article_Publisher_Presenter;
use Yoast\WP\Free\Tests\TestCase;

/**
 * Class Article_Publisher_Presenter
 *
 * @coversDefaultClass \Yoast\WP\Free\Presenters\Open_Graph\Article_Publisher_Presenter
 *
 * @group presenters
 * @group open-graph
 */
class Article_Publisher_Presenter_Test extends TestCase {

	/**
	 * @var Article_Publisher_Presenter
	 */
	protected $instance;

	/**
	 * @var Indexable_Presentation
	 */
	protected $presentation;

	/**
	 * Sets up the test class.
	 */
	public function setUp() {
		$this->instance     = new Article_Publisher_Presenter();
		$this->presentation = new Indexable_Presentation();

		return parent::setUp();
	}

	/**
	 * Tests whether the presenter returns the correct title.
	 *
	 * @covers ::present
	 */
	public function test_present() {
		$this->presentation->og_article_publisher = 'https://example.com';

		$expected = '<meta property="article:publisher" content="https://example.com" />';
		$actual   = $this->instance->present( $this->presentation );

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Tests the presenter with an empty site name.
	 *
	 * @covers ::present
	 */
	public function test_present_empty_article_publisher() {
		$this->presentation->og_article_publisher = '';

		$expected = '';
		$actual   = $this->instance->present( $this->presentation );

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Tests whether the presenter returns the correct publisher, when the `wpseo_opengraph_author_facebook` filter is applied.
	 *
	 * @covers ::present
	 * @covers ::filter
	 */
	public function test_present_filter() {
		$this->presentation->og_article_publisher = 'https://example.com';

		Monkey\Filters\expectApplied( 'wpseo_og_article_publisher' )
			->once()
			->with( 'https://example.com' )
			->andReturn( 'https://otherpublisher.com' );

		$expected = '<meta property="article:publisher" content="https://otherpublisher.com" />';
		$actual   = $this->instance->present( $this->presentation );

		$this->assertEquals( $expected, $actual );
	}
}
