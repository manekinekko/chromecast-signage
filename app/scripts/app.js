angular.module('siiCom', ['angularFileUpload'])
	.constant('API', {
		'REST': 'http://localhost:8001/api',
		'SOCKET': 'http://localhost:8002'
	})
	.constant('DEVICES', Array.apply(null, {length:100}).map(function(o, i){
		return {name: 'Chromecast #'+(i+1)};
	}))
	.controller('MainCtrl', [
		'$scope', '$http', '$timeout', 'socket', 'API', 'DEVICES',
		function($scope, $http, $timeout, socket, API, DEVICES) {
			var devicesLinks = {};
			$scope.devices = [];
			$scope.mediaDevice = 'image';
			$scope.mediaAll = 'custom';
			$scope.images = [];

			socket.on('api.devices.update', function(data) {
				console.log(data);

				// $scope.devices = data.devices;
				devicesLinks = data.xlink;
			});

			$scope.refresh = function() {
				$scope.devices = [];
				$timeout(function() {
					$http.get(API.REST + '/devices/')
						.success(function(res) {
							$scope.devices = res.devices;
							devicesLinks = res.xlink;
						})
						.error(function() {
							$scope.devices = [];
						})
				}, 1000);
			};

			$scope.playDevice = function(device) {
				if ($scope.playDevice === 'custom') {
					$http.post(device.xlink.play[$scope.mediaDevice], {
						links: $scope.images,
						base64: true
					})
						.success(function(res) {
							$scope.msg = res.devices;
						})
						.error(function(err) {
							$scope.msg = res.err;
						});
				} else {
					$http.get(device.xlink.play[$scope.mediaDevice])
						.success(function(res) {
							$scope.msg = res.devices;
						})
						.error(function(err) {
							$scope.msg = res.err;
						});
				}
			};

			$scope.stopDevice = function(device) {
				$http.get(device.xlink.stop)
					.success(function(res) {
						$scope.msg = res.devices;
					})
					.error(function(err) {
						$scope.msg = res.err;
					});
			};

			$scope.playAll = function() {
				if ($scope.mediaAll === 'custom') {
					$http.post(devicesLinks.play[$scope.mediaAll], {
						links: $scope.images,
						base64: true
					})
						.success(function(res) {
							$scope.msg = res.devices;
						})
						.error(function(err) {
							$scope.msg = res.err;
						});
				} else {
					$http.get(devicesLinks.play[$scope.mediaAll])
						.success(function(res) {
							$scope.msg = res.devices;
						})
						.error(function(err) {
							$scope.msg = res.err;
						});
				}
			};

			$scope.stopAll = function() {
				$http.get(devicesLinks.stop)
					.success(function(res) {
						$scope.msg = res.devices;
					})
					.error(function(err) {
						$scope.msg = res.err;
					});
			};

			$scope.removeCustomFile = function(index) {
				$scope.images.splice(index, 1);
			}

		}
	])
	.controller('UploadController', [
		'$scope', '$upload', 'API',
		function($scope, $upload, API) {
			$scope.onFileSelect = function($files) {
				for (var i = 0; i < $files.length; i++) {
					var file = $files[i];
					$scope.upload = $upload.upload({
						url: API.REST + '/upload', //upload.php script, node.js route, or servlet url
						//method: 'POST' or 'PUT',
						//headers: {'header-key': 'header-value'},
						//withCredentials: true,
						data: {
							myObj: $scope.myModelObj
						},
						file: file, // or list of files ($files) for html5 only
						//fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
						// customize file formData name ('Content-Disposition'), server side file variable name. 
						//fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file' 
						// customize how data is added to formData. See #40#issuecomment-28612000 for sample code
						//formDataAppender: function(formData, key, val){}
					}).progress(function(evt) {
						console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
					}).success(function(data, status, headers, config) {
						// file is uploaded successfully
						console.log(data);
						$scope.images.push({
							file: data.xlink,
							name: data.name
						});
					});
					//.error(...)
					//.then(success, error, progress); 
					// access or attach event listeners to the underlying XMLHttpRequest.
					//.xhr(function(xhr){xhr.upload.addEventListener(...)})
				}
			};
		}
	])
	.directive('fileDropzone', function() {
		return {
			restrict: 'A',
			scope: {
				files: '='
			},
			link: function(scope, element, attrs) {
				var checkSize, isTypeValid, processDragOverOrEnter, validMimeTypes, readFile;
				processDragOverOrEnter = function(event) {
					if (event != null) {
						event.preventDefault();
					}
					event.dataTransfer.effectAllowed = 'copy';
					return false;
				};
				validMimeTypes = attrs.fileDropzone;
				checkSize = function(size) {
					var _ref;
					if (((_ref = attrs.maxFileSize) === (void 0) || _ref === '') || (size / 1024) / 1024 < attrs.maxFileSize) {
						return true;
					} else {
						alert("File must be smaller than " + attrs.maxFileSize + " MB");
						return false;
					}
				};
				isTypeValid = function(type) {
					if (type !== '' && (validMimeTypes.length === 0 || validMimeTypes === '') || validMimeTypes.indexOf(type) > -1) {
						return true;
					} else {
						alert("Invalid file type.  File must be one of following types " + validMimeTypes);
						return false;
					}
				};
				readFile = function(file) {
					var name, reader, size, type;
					name = file.name;
					type = file.type;
					size = file.size;
					reader = new FileReader();
					reader.onload = function(evt) {
						if (checkSize(size) && isTypeValid(type)) {
							return scope.$apply(function() {
								return scope.files.push({
									file: evt.target.result,
									name: name
								});
							});
						}
					};
					reader.readAsDataURL(file);
				};
				element.bind('dragover', processDragOverOrEnter);
				element.bind('dragenter', processDragOverOrEnter);
				return element.bind('drop', function(event) {
					console.log(event);

					var filesCount = event.dataTransfer.files.length;
					if (event != null) {
						event.preventDefault();
					}
					for (var i = 0; i < filesCount; i += 1) {
						readFile(event.dataTransfer.files[i]);
					}
					return false;
				});
			}
		};
	})
	.factory('socket', function($rootScope, API) {
		var socket = io.connect(API.SOCKET);
		return {
			on: function(eventName, callback) {
				socket.on(eventName, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						callback.apply(socket, args);
					});
				});
			},
			emit: function(eventName, data, callback) {
				socket.emit(eventName, data, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						if (callback) {
							callback.apply(socket, args);
						}
					});
				})
			}
		};
	});