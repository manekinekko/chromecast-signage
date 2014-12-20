module.exports = {

	'video': {

		// Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
		contentId: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
		contentType: 'video/mp4',
		streamType: 'BUFFERED', // or LIVE

		// Title and cover displayed while buffering
		metadata: {
			type: 0,
			metadataType: 0,
			title: "Big Buck Bunny",
			images: [{
				url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
			}]
		}
	},

	'image': {
		contentId: 'http://i1.wp.com/www.metalinjection.net/wp-content/uploads/2014/04/Game-of-Thrones-metal.jpg?fit=750%2C1000',
		contentType: 'image/jpeg',
		streamType: 'LIVE',

		metadata: {
			type: 4,
			metadataType: 4
		}
	},

	'custom': {
		'video': {
			contentId: '',
			contentType: '',
			streamType: 'BUFFERED', // or LIVE
			metadata: {
				type: 0,
				metadataType: 0,
				title: '',
				images: [{
					url: ''
				}]
			}
		},
		'image': {
			contentId: '',
			contentType: '',
			streamType: 'LIVE',

			metadata: {
				type: 4,
				metadataType: 4
			}
		}
	}

};