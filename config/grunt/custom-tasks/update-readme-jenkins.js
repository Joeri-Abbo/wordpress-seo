const mergeChangeLog = require( "../lib/merge-changelog" );
const parseVersion = require( "../lib/parse-version" );
const _isEmpty = require( "lodash/isEmpty" );

/**
 * A task to remove old changelog entries and add new ones in readme.txt.
 *
 * @param {Object} grunt The grunt helper object.
 * @returns {void}
 */
module.exports = function( grunt ) {
	grunt.registerTask(
		"update-readme-jenkins",
		"Prompts the user for the changelog entries and updates the readme.txt",
		function() {
			const done = this.async();

			const newVersion = grunt.option( "plugin-version" );
			const versionNumber = parseVersion( newVersion );
			const suffixes = {
				'one': 'st',
				'two': 'nd',
				'few': 'rd',
				'other': 'th'
			}
			const pr = new Intl.PluralRules('en-US', {
				type: 'ordinal'
			})
			const format = (number) => `${number}${suffixes[pr.select(number)]}`

			let changelog = grunt.file.read( "./readme.txt" );
			let changelogIn = grunt.file.read( "./.tmp/change_in_log.md" );

			const releaseInChangelog = /[=] \d+\.\d+(\.\d+)? =/g;
			const allReleasesInChangelog = changelog.match( releaseInChangelog );
			const changelogVersions = allReleasesInChangelog.map(
				element => parseVersion( element.slice( 2, element.length - 2 ) )
			);

			// Check if the current version already exists in the changelog.
			const containsCurrentVersion = ! _isEmpty(
				changelogVersions.filter( version => {
					return (
						versionNumber.major === version.major &&
						versionNumber.minor === version.minor &&
						versionNumber.patch === version.patch
					);
				} )
			);

			// Only if the current version is not in the changelog yet, and is not a patch, we remove old changelog entries.
			if ( ! containsCurrentVersion && versionNumber.patch === 0 ) {
				let cleanedChangelog = changelog;
				const highestMajor = Math.max( ...changelogVersions.map( version => version.major ) );
				const lowestMajor = Math.min( ...changelogVersions.map( version => version.major ) );

				if ( highestMajor === lowestMajor ) {
					// If there are only multiple minor versions of the same major version, remove all entries from the oldest minor version.
					const lowestMinor = Math.min( ...changelogVersions.map( version => version.minor ) );
					const lowestVersion = `${lowestMajor}.${lowestMinor}`;
					cleanedChangelog = changelog.replace(
						new RegExp( "= " + lowestVersion + "(.|\\n)*= Earlier versions =" ),
						"= Earlier versions ="
					);
				} else {
					// If there are multiple major versions in the changelog, remove all entries from the oldest major version.
					cleanedChangelog = changelog.replace(
						new RegExp( "= " + lowestMajor + "(.|\\n)*= Earlier versions =" ),
						"= Earlier versions ="
					);
				}

				// If something has changed, persist this.
				if ( cleanedChangelog !== changelog ) {
					changelog = cleanedChangelog;

					// Update the grunt reference to the changelog.
					grunt.option( "changelog", changelog );

					// Write changes to the file.
					grunt.file.write( "./readme.txt", changelog );
				}
			}

			//strip header from new entry file.
			changelogIn = changelogIn.replace( new RegExp( "# Yoast/wordpress-seo:(.|\\n)*?(?=\n[ a-zA-Z]+:)" ),
				""
			);



			// If the current version is already in the changelog, retrieve the full readme and let the user edit it.
			if ( containsCurrentVersion ) {
				// Present the user with the entire changelog file.
				mergeChangeLog( { newChangelogContent: changelog } ).then( newChangelog => {
					// Update the grunt reference to the changelog.
					grunt.option( "changelog", newChangelog );

					// Write changes to the file.
					grunt.file.write( "./readme.txt", newChangelog );
					done();
				} );
			} else {
				// If the current version is not in the changelog, allow the user to enter new changelog items.
				let changelogVersionNumber = versionNumber.major + "." + versionNumber.minor;

				// Only add the patch number if we're actually doing a patch.
				if ( versionNumber.patch !== 0 ) {
					changelogVersionNumber += "." + versionNumber.patch;
				}
				// Present the user with only the version number
				
				const d = new Date(2010, 7, 5);
				const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
				const mo = new Intl.DateTimeFormat('en', { month: 'long' }).format(d);
				const da = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d);
				datestring = `${mo} ${format(da)}, ${ye}`
				mergeChangeLog( { newChangelogContent: `= ${changelogVersionNumber} =\nRelease Date: ` + datestring + `\n` + changelogIn } ).then( newChangelog => {
					// Update the grunt reference to the changelog.
					grunt.option( "changelog", newChangelog );

					// Add the user input to the changelog, behind the == Changelog == header.
					changelog = changelog.replace( /[=]= Changelog ==/ig, "== Changelog ==\n\n" + newChangelog.trim() );

					// Write changes to the file.
					grunt.file.write( "./readme.txt", changelog );
					done();
				} );
			}

			// // Stage the changed readme.txt.
			// grunt.config( "gitadd.addChangelog.files", { src: [ "./readme.txt" ] } );
			// grunt.task.run( "gitadd:addChangelog" );

			// // Check if there is something to commit with `git status` first.
			// grunt.config( "gitstatus.checkChangelog.options.callback", function( changes ) {
			// 	// First character of the code checks the status in the index.
			// 	const hasStagedChangelog = changes.some( change => change.code[ 0 ] !== " " && change.file === "readme.txt" );

			// 	if ( hasStagedChangelog ) {
			// 		// Commit the changed readme.txt.
			// 		grunt.config( "gitcommit.commitChangelog.options.message", "Add changelog" );
			// 		grunt.task.run( "gitcommit:commitChangelog" );
			// 	} else {
			// 		grunt.log.writeln( "Changelog is unchanged. Nothing to commit." );
			// 	}
			// } );

			// grunt.task.run( "gitstatus:checkChangelog" );
		}
	);
};
